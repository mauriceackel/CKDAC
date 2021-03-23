import { AsyncAPIDocument } from '@asyncapi/parser';
import { OpenAPI } from 'openapi-types';

export enum ApiType {
  OPEN_API,
  ASYNC_API,
}

export interface ApiModel {
  id: string;
  createdBy: string;
  name: string;
  type: ApiType;
  apiSpec: string;
  apiObject?: OpenAPI.Document | AsyncAPIDocument;
  metadata: {
    company?: string;
    keywords?: string;
  };
}

export interface OpenApiModel extends ApiModel {
  type: ApiType.OPEN_API;
  apiObject?: OpenAPI.Document;
}

export interface AsyncApiModel extends ApiModel {
  type: ApiType.ASYNC_API;
  apiObject?: AsyncAPIDocument;
}
