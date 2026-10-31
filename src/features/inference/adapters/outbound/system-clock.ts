import type { Clock } from '../../ports/outbound/clock'

export class SystemClock implements Clock {
  now(): number { return Date.now() }
  schedule(callback: () => void, milliseconds: number): () => void {
    const timer = setTimeout(callback, milliseconds)
    return () => clearTimeout(timer)
  }
}
