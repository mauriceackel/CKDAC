export abstract class ApiResponse {
    private status: string;
    public get Status() {
        return this.status;
    }
    private code: number;
    public get Code() {
        return this.code;
    }
    private messages: Array<string>;
    public get Messages() {
        return this.messages;
    }

    protected result: any;
    public get Result() {
        return this.result;
    }

    constructor(status: string, code: number, messages: Array<string> = []) {
        this.status = status;
        this.code = code;
        this.messages = messages;
    }
}

export class SuccessResponse extends ApiResponse {
    constructor(code: number, messages?: Array<string>) {
        super("ok", code, messages);
    }
}

export class ErrorResponse extends ApiResponse {
    constructor(code: number, messages?: Array<string>) {
        super("error", code, messages);
    }
}