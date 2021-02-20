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
  metadata: {
    company?: string;
    keywords?: string;
  };
}
