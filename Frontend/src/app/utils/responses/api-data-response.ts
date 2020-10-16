import { IApi } from '~/app/models/api.model';
import { ApiResponse } from './api-response';

export interface ApiDataResponse extends ApiResponse {
  result: {
    api?: IApi
    apis?: Array<IApi>
  }
}
