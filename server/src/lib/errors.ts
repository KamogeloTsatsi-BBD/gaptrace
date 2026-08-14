/**
 * Input that failed validation at a service boundary. Routes map this to a
 * 400; anything else escaping a service is a 500.
 */
export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidInputError'
  }
}
