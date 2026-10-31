export interface Journal {
  record(event: string, details: Readonly<Record<string, unknown>>): void
}
