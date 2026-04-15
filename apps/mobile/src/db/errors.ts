export class DatabaseInitializationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'DatabaseInitializationError';
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}
