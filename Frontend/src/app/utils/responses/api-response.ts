export interface ApiResponse {
    status: string;
    code: number;
    messages: Array<string>;
    result: any;
}

export interface SuccessResponse extends ApiResponse {
}

export interface ErrorResponse extends ApiResponse {
}