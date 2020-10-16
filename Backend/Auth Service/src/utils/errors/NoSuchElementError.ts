export class NoSuchElementError extends Error {
    constructor(message?: string) {
        super(message);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, NoSuchElementError.prototype);
    }
}