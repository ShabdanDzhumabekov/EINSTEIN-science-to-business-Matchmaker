import { RoleInferenceError } from './role-inference-error'

export class Spending {
  private reportedUSD = 0
  private readonly pending = new Map<string, number>()
  constructor(private readonly limitUSD: number) {}
  reserve(requestId: string, amount: number): void {
    if (this.reportedUSD + this.uncertainUSD + amount > this.limitUSD + 1e-12) {
      throw new RoleInferenceError('budget', 'Inference budget exhausted')
    }
    this.pending.set(requestId, amount)
  }
  settle(requestId: string, costUSD: number | undefined): void {
    if (costUSD === undefined) return
    this.pending.delete(requestId)
    this.reportedUSD += costUSD
    if (this.reportedUSD + this.uncertainUSD > this.limitUSD + 1e-12) {
      throw new RoleInferenceError('budget', 'Reported spending exceeded the configured budget')
    }
  }
  releaseUnsent(requestId: string): void { this.pending.delete(requestId) }
  private get uncertainUSD(): number { return [...this.pending.values()].reduce((sum, amount) => sum + amount, 0) }
  snapshot() { return { reportedUSD: this.reportedUSD, uncertainUSD: this.uncertainUSD } }
}
