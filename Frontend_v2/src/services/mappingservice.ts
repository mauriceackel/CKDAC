import axios from 'axios';
import { BACKEND_BASE_URL } from 'config';
import { ApiType } from 'models/ApiModel';
import ApiResponse from 'models/ApiResponse';
import { MappingModel, MappingPair } from 'models/MappingModel';
import { OpenApiOperation } from 'utils/helpers/swaggerParser';
import { unflatten } from 'flat';

// #region Types
export type MappedOperations = { apiId: string; operationId: string }[];

export type MappingGenerationResult =
  | {
      type: ApiType.OPEN_API;
      mappingPairs: {
        request: MappingPair[];
        response: MappingPair[];
      };
    }
  | {
      type: ApiType.ASYNC_API;
      mappingPairs: MappingPair[];
    };
// #endregion

// #region Mapping Generation
export async function getMappedOperations(
  apiType: ApiType,
  sourceId: string,
  targetApiId: string,
): Promise<MappedOperations> {
  const response = await axios.post<ApiResponse<MappedOperations>>(
    `${BACKEND_BASE_URL}/mappings/mapped-operations`,
    {
      apiType,
      sourceId,
      targetApiId,
    },
  );

  return response.data.result;
}

export async function generateMapping(
  sourceOperation: OpenApiOperation,
  targetOperations: Record<string, OpenApiOperation>,
): Promise<MappingGenerationResult> {
  const response = await axios.post<ApiResponse<MappingGenerationResult>>(
    `${BACKEND_BASE_URL}/mappings/generate`,
    {
      source: sourceOperation,
      targets: targetOperations,
      // TODO: Add direction for asyncAPI?!
    },
  );

  return response.data.result;
}

export async function recomputeAttributeMapping(
  sourceOperation: OpenApiOperation,
  targetOperations: Record<string, OpenApiOperation>,
  mappingPairs: MappingPair[],
): Promise<MappingGenerationResult> {
  const response = await axios.post<ApiResponse<MappingGenerationResult>>(
    `${BACKEND_BASE_URL}/mappings/generate/attribute`,
    {
      source: sourceOperation,
      targets: targetOperations,
      // TODO: Add direction for asyncAPI?!
      mappingPairs,
    },
  );

  return response.data.result;
}
// #endregion

// #region Mapping Management
export async function createMapping(mapping: MappingModel): Promise<void> {
  await axios.post<ApiResponse<MappingGenerationResult>>(
    `${BACKEND_BASE_URL}/mappings/`,
    mapping,
  );
}
// #endregion

// #region Helpers
type MappingTransformation = {
  [key: string]: MappingTransformation | string;
};
export function pairs2Trans(
  mappingPairs: MappingPair[],
): MappingTransformation {
  const flatMapping = mappingPairs.reduce<Record<string, string>>(
    (mapping, mappingPair) => ({
      ...mapping,
      [mappingPair.requiredAttributeId]: mappingPair.mappingTransformation,
    }),
    {},
  );

  return unflatten(flatMapping);
}
// #endregion
