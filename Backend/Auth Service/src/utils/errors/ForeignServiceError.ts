export class ForeignServiceError extends Error {
    public status : number;

    constructor(status: number, message?: string) {
        super(message);
        this.status = status;
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ForeignServiceError.prototype);
    }
}