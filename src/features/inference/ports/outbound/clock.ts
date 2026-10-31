export interface Clock {
  now(): number
  schedule(callback: () => void, milliseconds: number): () => void
}
