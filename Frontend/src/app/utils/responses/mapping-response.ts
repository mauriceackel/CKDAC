import { IMapping } from '~/app/models/mapping.model';
import { ApiResponse } from './api-response';

export interface MappingResponse extends ApiResponse {
  result: {
    mapping?: IMapping
    mappings?: Array<IMapping>
  }
}
