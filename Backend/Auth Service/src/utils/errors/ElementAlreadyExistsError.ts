export class ElementAlreadyExistsError extends Error {
    constructor(message?: string) {
        super(message);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ElementAlreadyExistsError.prototype);
    }
}