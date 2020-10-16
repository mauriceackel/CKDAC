import { IApi } from "./ApiModel";

export interface IOperation {
    api: IApi,
    operationId: string
}

export interface IOpenApiOperation extends IOperation {
    responseId: string
}

export interface IAsyncApiOperation extends IOperation {
}
