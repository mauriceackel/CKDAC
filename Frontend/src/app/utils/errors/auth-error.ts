
export class AuthError extends Error {

  constructor(message?: string) {
      super(message);
      // Set the prototype explicitly.
      Object.setPrototypeOf(this, AuthError.prototype);
  }
}
