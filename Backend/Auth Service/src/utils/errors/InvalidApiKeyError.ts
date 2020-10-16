export class InvalidApiKeyError extends Error {
    public description : string;

    constructor(message: string, description: string) {
        super(message);
        this.description = description;
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, InvalidApiKeyError.prototype);
    }
}