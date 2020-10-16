import { IMapping } from './mapping.model';

export interface IOpenApiMapping extends IMapping {
  requestMapping: string //JSONata mapping
  responseMapping: string //JSONata mapping
}
