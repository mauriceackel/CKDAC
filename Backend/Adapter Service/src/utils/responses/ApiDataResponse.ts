import { IApi } from "../../models/ApiModel";
import { SuccessResponse } from "./ApiResponse";

abstract class ApiResponse extends SuccessResponse {
    public get Result(): { api?: IApi, apis?: Array<IApi> } {
        return this.result;
    }
    public result: {
        api?: IApi,
        apis?: Array<IApi>
    };

    constructor(code: number, messages: Array<string>) {
        super(code, messages);
        this.result = {};
    }
}

export class SingleApiResponse extends ApiResponse {
    constructor(code: number, messages: Array<string> = [], api: IApi) {
        super(code, messages);
        this.result.api = api;
    }
}

export class MultiApiResponse extends ApiResponse {
    constructor(code: number, messages: Array<string> = [], apis: Array<IApi>) {
        super(code, messages);
        this.result.apis = apis;
    }
}