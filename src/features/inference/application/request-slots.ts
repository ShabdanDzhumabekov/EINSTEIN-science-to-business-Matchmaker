import { RoleInferenceError } from '../domain/role-inference-error'

export class RequestSlots {
  private active = 0
  private readonly waiting: Array<() => void> = []
  constructor(private readonly limit: number) {}
  acquire(signal: AbortSignal): Promise<() => void> {
    return new Promise((resolve, reject) => {
      const abort = () => {
        const index = this.waiting.indexOf(start)
        if (index >= 0) this.waiting.splice(index, 1)
        reject(new RoleInferenceError('cancelled', 'Request cancelled before dispatch'))
      }
      const start = () => {
        signal.removeEventListener('abort', abort)
        this.active++
        let isReleased = false
        resolve(() => {
          if (isReleased) return
          isReleased = true
          this.active--
          this.waiting.shift()?.()
        })
      }
      if (signal.aborted) { abort(); return }
      signal.addEventListener('abort', abort, { once: true })
      if (this.active < this.limit) start()
      else this.waiting.push(start)
    })
  }
}
