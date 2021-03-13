import { ApiType } from './ApiModel';

export enum MappingType {
  TRANSFORMATION,
  AUTO,
  REVERSE,
}

export enum MappingDirection {
  INPUT,
  OUTPUT,
}

export interface MappingModel {
  id?: string;
  createdBy: string;
  apiType: ApiType;
  type: MappingType;
  sourceId: string;
  targetIds: string[];
}

export interface OpenApiMappingModel extends MappingModel {
  apiType: ApiType.OPEN_API;
  requestMapping: string; // JSONata mapping
  responseMapping: string; // JSONata mapping
}

export interface AsyncApiMappingModel extends MappingModel {
  apiType: ApiType.ASYNC_API;
  direction: MappingDirection; // If input, source & targets are subscribers. If output, providers.
  // The key is the id of the target
  topics: {
    source: string;
    targets: { [targetId: string]: string };
  };
  servers: {
    source: string;
    targets: { [targetId: string]: string };
  };
  messageMappings: { [key: string]: string }; // JSONata mappings
}

export enum MappingPairType {
  MANUAL,
  ATTRIBUTE,
  MAPPING,
  SYNTAX,
}

export interface MappingPair {
  creationType: MappingPairType;
  providedAttributeIds: string[];
  requiredAttributeId: string;
  mappingTransformation: string;
}
