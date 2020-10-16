import { SuccessResponse } from "./ApiResponse";

export class TokenResponse extends SuccessResponse {
    public get Result(): { accessToken: string, refreshToken: string } {
        return this.result;
    }

    protected result: {
        accessToken: string,
        refreshToken: string
    };

    constructor(code: number, messages: Array<string> = [], accessToken: string, refreshToken: string) {
        super(code, messages);
        this.result = {
            accessToken: accessToken,
            refreshToken: refreshToken
        }
    }
}

export class ResetTokenResponse extends SuccessResponse {
    public get Result(): { resetToken: string } {
        return this.result;
    }

    protected result: {
        resetToken: string
    };

    constructor(code: number, messages: Array<string> = [], resetToken: string) {
        super(code, messages);
        this.result = {
            resetToken: resetToken
        }
    }
}