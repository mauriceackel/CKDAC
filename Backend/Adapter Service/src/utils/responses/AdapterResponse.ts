import { SuccessResponse } from "./ApiResponse";

export class AdapterResponse extends SuccessResponse {
    public get Result(): { fileId: string } {
        return this.result;
    }
    protected result: {
        fileId: string
    };

    constructor(code: number, messages: Array<string> = [], fileId: string) {
        super(code, messages);
        this.result = { fileId };
    }
}