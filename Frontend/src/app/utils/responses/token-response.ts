import { SuccessResponse } from './api-response';

export interface TokenResponse extends SuccessResponse {
    result: {
        accessToken: string,
        refreshToken: string
    };
}

export interface ResetTokenResponse extends SuccessResponse {
    result: {
        resetToken: string
    };
}
