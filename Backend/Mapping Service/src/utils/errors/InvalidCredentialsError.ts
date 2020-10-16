export class InvalidCredentialsError extends Error {
    constructor(message?: string) {
        super(message);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
    }
}