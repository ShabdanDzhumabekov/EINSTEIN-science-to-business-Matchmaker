export class RoleInferenceError extends Error {
  constructor(
    readonly code: 'timeout' | 'cancelled' | 'budget' | 'provider' | 'invalid_output' | 'journal',
    message: string,
    options?: ErrorOptions,
  ) { super(message, options); this.name = 'RoleInferenceError' }
}
