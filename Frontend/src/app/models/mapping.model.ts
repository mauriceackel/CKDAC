import { KeyChain } from '../utils/json-tree';
import { ApiType } from './api.model';

export interface IMappingPair {
  provided: KeyChain[]
  required: KeyChain
  mappingCode: string
}

export enum MappingType {
    TRANSFORMATION,
    AUTO,
    REVERSE
}

export enum MappingDirection {
    INPUT, OUTPUT
}

export interface IMapping {
    id: string
    createdBy: string
    apiType: ApiType
    type: MappingType
    sourceId: string
    targetIds: string[]
}

export interface IAsyncApiMapping extends IMapping {
    direction: MappingDirection //If input, source & targets are subscribers. If output, providers.
    // The key is the id of the target
    topics: {
        source: string,
        targets: { [targetId: string]: string }
    }
    servers: {
        source: string,
        targets: { [targetId: string]: string }
    }
    messageMappings: { [key: string]: string } //JSONata mappings
}

export interface IOpenApiMapping extends IMapping {
    requestMapping: string //JSONata mapping
    responseMapping: string //JSONata mapping
}
