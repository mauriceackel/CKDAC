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
  apiObject?: OpenAPI.Document;
  metadata: {
    company?: string;
    keywords?: string;
  };
}
