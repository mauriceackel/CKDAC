import { IApi } from './api.model';

export interface IOpenApiInterface {
  api: IApi,
  operationId: string,
  responseId: string
}

export interface IAsyncApiInterface {
  api: IApi,
  operationId: string,
  url: string,
  server: string
}
