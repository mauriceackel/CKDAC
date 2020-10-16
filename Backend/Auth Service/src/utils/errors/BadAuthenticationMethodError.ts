export class BadAuthenticationMethodError extends Error {
    public description: string;

    constructor(message: string, description: string) {
        super(message);
        this.description = description;

        Object.setPrototypeOf(this, BadAuthenticationMethodError.prototype);
    }
}