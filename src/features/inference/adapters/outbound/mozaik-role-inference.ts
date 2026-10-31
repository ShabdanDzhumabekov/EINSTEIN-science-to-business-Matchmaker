import { randomUUID, createHash } from 'node:crypto'
import { z } from 'zod'
import { createAgent, createHuman, defineRuntime, RuntimeState, SituationSpecification, ModelMessageItem,
  type InferenceInput, type InferenceOutput, type SemanticEvent } from '@mozaik-ai/core'
import type { RoleInference, RoleInferenceRequest } from '../../../../contracts/role-inference'
import type { InferenceSettings } from '../../domain/inference-settings'
import { RoleInferenceError } from '../../domain/role-inference-error'
import { Spending } from '../../domain/spending'
import { RequestSlots } from '../../application/request-slots'
import type { Completion } from '../../ports/outbound/completion'
import type { Clock } from '../../ports/outbound/clock'
import type { Journal } from '../../ports/outbound/journal'

interface Pending {
  readonly requestId: string
  readonly agentId: string
  readonly controller: AbortController
  readonly deadline: number
  readonly request: Parameters<Completion['infer']>[0]
  isActive: boolean
  finish(text: string): void
  fail(error: RoleInferenceError): void
}
class EveryEvent extends SituationSpecification { isSatisfiedBy() { return true } }
class InferenceState extends RuntimeState {}

export class MozaikRoleInference implements RoleInference {
  private readonly runtime = defineRuntime<RuntimeState>()
  private readonly pending = new Map<string, Pending>()
  private readonly slots: RequestSlots
  private readonly spending: Spending
  private hasJournalFailed = false
  constructor(
    private readonly settings: InferenceSettings,
    private readonly completion: Completion,
    private readonly clock: Clock,
    private readonly journal: Journal,
  ) {
    if (process.env.MOZAIK_API_KEY !== '') throw new Error('Set MOZAIK_API_KEY to an empty string before local-only inference')
    if (![settings.timeoutMs, settings.concurrency, settings.budgetUSD, settings.reserveUSD, settings.maxOutputTokens].every(n => Number.isFinite(n) && n > 0)
      || !Number.isInteger(settings.concurrency) || !Number.isInteger(settings.maxOutputTokens)
      || settings.reserveUSD > settings.budgetUSD) throw new RangeError('Invalid inference settings')
    this.slots = new RequestSlots(settings.concurrency)
    this.spending = new Spending(settings.budgetUSD)
    this.runtime.initializeRuntime({ state: new InferenceState(), inferenceRunnerConfig: {
      runner: { run: input => this.runRequest(input), async *stream() { throw new Error('Streaming is disabled') } },
    } })
    this.runtime.join(createHuman({ name: 'Inference observer', capabilities: ['observe'], handlers: [{
      specification: new EveryEvent(), processor: { apply: ({ event }) => this.onEvent(event) },
    }] }))
  }
  infer<Output>(request: RoleInferenceRequest<Output>): Promise<Output> {
    if (this.hasJournalFailed) return Promise.reject(new RoleInferenceError('journal', 'Journal unavailable'))
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(request.output.name)) return Promise.reject(new RoleInferenceError('invalid_output', 'Invalid schema name'))
    let schema: Record<string, unknown>
    try { schema = z.toJSONSchema(z.strictObject({ result: request.output.schema }), { target: 'draft-7' }) }
    catch (cause) { return Promise.reject(new RoleInferenceError('invalid_output', 'Unsupported output schema', { cause })) }
    delete schema.$schema
    const requestId = randomUUID()
    const agent = createAgent({ name: `${request.role}:${requestId}`, instruction: request.instruction,
      capabilities: [request.role], tools: [], handlers: [] })
    const context = agent.getMemory().getContext()
    return new Promise<Output>((resolve, reject) => {
      let cancelTimer = () => {}
      const cleanup = () => {
        cancelTimer(); this.pending.delete(context.id)
        queueMicrotask(() => this.runtime.leave(agent))
      }
      const pending: Pending = {
        requestId, agentId: agent.getId(), controller: new AbortController(), deadline: this.clock.now() + this.settings.timeoutMs,
        isActive: true, request: { model: request.role === 'critic' ? this.settings.modelCritic
          : request.role === 'matchmaker' || request.role === 'proposal_writer' ? this.settings.modelStrong : this.settings.modelFast,
          instruction: request.instruction, input: request.input, schemaName: request.output.name, schema,
          reasoningEffort: 'medium',
          maxOutputTokens: this.settings.maxOutputTokens },
        finish: text => {
          if (!pending.isActive) return
          if (this.clock.now() >= pending.deadline) { pending.fail(new RoleInferenceError('timeout', 'Inference deadline reached')); return }
          try {
            const envelope = z.strictObject({ result: request.output.schema }).parse(JSON.parse(text))
            this.log('inference.completed', { requestId, role: request.role, spending: this.spending.snapshot() })
            pending.isActive = false; cleanup(); resolve(envelope.result)
          } catch (cause) {
            pending.fail(cause instanceof RoleInferenceError ? cause : new RoleInferenceError('invalid_output', 'Model output does not match the requested schema', { cause }))
          }
        },
        fail: error => {
          if (!pending.isActive) return
          pending.isActive = false; pending.controller.abort(); cleanup()
          let failure = error
          if (!this.hasJournalFailed) {
            try { this.log('inference.failed', { requestId, role: request.role, code: error.code }) }
            catch (cause) { failure = new RoleInferenceError('journal', 'Journal write failed', { cause }) }
          }
          reject(failure)
        },
      }
      this.pending.set(context.id, pending)
      cancelTimer = this.clock.schedule(() => pending.fail(new RoleInferenceError('timeout', 'Inference deadline reached')), this.settings.timeoutMs)
      try {
        this.log('inference.started', { requestId, agentId: agent.getId(), contextId: context.id, role: request.role, model: pending.request.model, schemaName: request.output.name,
          reasoningEffort: pending.request.reasoningEffort,
          inputDigest: createHash('sha256').update(request.input).digest('hex'), deadline: pending.deadline })
        this.runtime.join(agent)
        this.runtime.runLoop(agent.getId(), request.input, { model: pending.request.model, context, maxOutputTokens: this.settings.maxOutputTokens })
      } catch (cause) { pending.fail(cause instanceof RoleInferenceError ? cause : new RoleInferenceError('provider', 'Cannot start agent loop', { cause })) }
    })
  }
  cancel(): void { for (const task of this.pending.values()) task.fail(new RoleInferenceError('cancelled', 'Inference cancelled')) }
  private onEvent(event: SemanticEvent): void {
    const task = [...this.pending.values()].find(p => p.agentId === event.producerId)
    if (!task?.isActive) return
    try {
      const metadata = z.object({ loopId: z.string().optional() }).safeParse(event.payload)
      this.log('mozaik.event', { requestId: task.requestId, eventType: event.type, agentId: event.producerId, loopId: metadata.success ? metadata.data.loopId : undefined })
      if (event.type === 'model.answer') {
        const payload = z.object({ answer: z.custom<ModelMessageItem>(item => item instanceof ModelMessageItem) }).parse(event.payload)
        task.finish(payload.answer.content.text)
      }
    } catch (cause) { task.fail(cause instanceof RoleInferenceError ? cause : new RoleInferenceError('provider', 'Runtime event failed', { cause })) }
  }
  private async runRequest(input: InferenceInput): Promise<InferenceOutput> {
    const task = this.pending.get(input.context.id)
    if (!task?.isActive) return this.control()
    let release: (() => void) | undefined
    let isDispatched = false
    let isReserved = false
    try {
      release = await this.slots.acquire(task.controller.signal)
      if (!task.isActive || this.clock.now() >= task.deadline) throw new RoleInferenceError('timeout', 'Inference deadline reached')
      this.spending.reserve(input.context.id, this.settings.reserveUSD); isReserved = true
      this.log('request.dispatched', { contextId: input.context.id, model: input.model })
      isDispatched = true
      const result = await this.completion.infer(task.request, task.controller.signal)
      this.log('request.received', { contextId: input.context.id, costUSD: result.costUSD ?? null, isLate: !task.isActive })
      this.spending.settle(input.context.id, result.costUSD)
      if (!task.isActive) return this.control()
      if (this.clock.now() >= task.deadline) throw new RoleInferenceError('timeout', 'Inference deadline reached')
      return { items: [ModelMessageItem.rehydrate({ text: result.text })], tokenUsage: undefined, rowResponse: {} }
    } catch (cause) {
      if (isReserved && !isDispatched) this.spending.releaseUnsent(input.context.id)
      task.fail(cause instanceof RoleInferenceError ? cause : new RoleInferenceError('provider', 'Completion request failed', { cause }))
      return this.control()
    } finally { release?.() }
  }
  private control(): InferenceOutput {
    return { items: [ModelMessageItem.rehydrate({ text: '{}' })], tokenUsage: undefined, rowResponse: {} }
  }
  private log(event: string, details: Record<string, unknown>): void {
    try { this.journal.record(event, details) }
    catch (cause) {
      this.hasJournalFailed = true
      const failure = new RoleInferenceError('journal', 'Journal write failed', { cause })
      for (const task of this.pending.values()) task.fail(failure)
      throw failure
    }
  }
}
