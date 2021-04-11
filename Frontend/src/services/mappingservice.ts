import axios from 'axios';
import { BACKEND_BASE_URL } from 'config';
import { ApiType } from 'models/ApiModel';
import ApiResponse from 'models/ApiResponse';
import {
  MappingDirection,
  MappingModel,
  MappingPair,
  MappingPairType,
  MappingType,
} from 'models/MappingModel';
import { OpenApiOperation } from 'utils/helpers/swaggerParser';
import flatten, { unflatten } from 'flat';
import { AsyncApiOperation } from 'utils/helpers/asyncApiParser';
import getinputs from '../utils/helpers/get-inputs/get-inputs';

// #region Types
export type MappedOperations = { apiId: string; operationId: string }[];

type OpenApiMappingGenerationResult = {
  type: ApiType.OPEN_API;
  mappingPairs: {
    request: MappingPair[];
    response: MappingPair[];
  };
};

type AsyncApiMappingGenerationResult = {
  type: ApiType.ASYNC_API;
  mappingPairs: MappingPair[];
};

export type MappingGenerationResult =
  | OpenApiMappingGenerationResult
  | AsyncApiMappingGenerationResult;
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
  sourceOperation: AsyncApiOperation,
  targetOperations: Record<string, AsyncApiOperation>,
  direction: MappingDirection,
): Promise<AsyncApiMappingGenerationResult>;
export async function generateMapping(
  sourceOperation: OpenApiOperation,
  targetOperations: Record<string, OpenApiOperation>,
  direction?: undefined,
): Promise<OpenApiMappingGenerationResult>;
export async function generateMapping<
  T extends OpenApiOperation | AsyncApiOperation
>(
  sourceOperation: T,
  targetOperations: Record<string, T>,
  direction?: MappingDirection,
): Promise<
  T extends AsyncApiOperation
    ? AsyncApiMappingGenerationResult
    : OpenApiMappingGenerationResult
> {
  const response = await axios.post<
    ApiResponse<
      T extends AsyncApiOperation
        ? AsyncApiMappingGenerationResult
        : OpenApiMappingGenerationResult
    >
  >(`${BACKEND_BASE_URL}/mappings/generate`, {
    source: sourceOperation,
    targets: targetOperations,
    ...(direction !== undefined ? { direction } : null),
  });

  return response.data.result;
}

export async function recomputeAttributeMapping(
  sourceOperation: AsyncApiOperation,
  targetOperations: Record<string, AsyncApiOperation>,
  mappingPairs: MappingPair[],
  direction: MappingDirection,
): Promise<AsyncApiMappingGenerationResult>;
export async function recomputeAttributeMapping(
  sourceOperation: OpenApiOperation,
  targetOperations: Record<string, OpenApiOperation>,
  mappingPairs: MappingPair[],
  direction?: undefined,
): Promise<OpenApiMappingGenerationResult>;
export async function recomputeAttributeMapping<
  T extends OpenApiOperation | AsyncApiOperation
>(
  sourceOperation: T,
  targetOperations: Record<string, T>,
  mappingPairs: MappingPair[],
  direction?: MappingDirection,
): Promise<
  T extends AsyncApiOperation
    ? AsyncApiMappingGenerationResult
    : OpenApiMappingGenerationResult
> {
  const response = await axios.post<
    ApiResponse<
      T extends AsyncApiOperation
        ? AsyncApiMappingGenerationResult
        : OpenApiMappingGenerationResult
    >
  >(`${BACKEND_BASE_URL}/mappings/generate/attribute`, {
    source: sourceOperation,
    targets: targetOperations,
    ...(direction !== undefined ? { direction } : null),
    mappingPairs,
  });

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

export async function updateMapping(mapping: MappingModel): Promise<void> {
  await axios.put<ApiResponse<MappingGenerationResult>>(
    `${BACKEND_BASE_URL}/mappings/${mapping.id}`,
    mapping,
  );
}

export async function getMappings(
  conditions: {
    type?: MappingType;
    apiType?: ApiType;
    createdBy?: string;
  } = {},
): Promise<MappingModel[]> {
  const query = new URLSearchParams();
  Object.entries(conditions).forEach(([key, value]) => {
    if (value !== undefined) {
      query.set(key, value?.toString());
    }
  });

  const response = await axios.get<ApiResponse<{ mappings: MappingModel[] }>>(
    `${BACKEND_BASE_URL}/mappings/?${query}`,
  );

  return response.data.result.mappings;
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

export function trans2Pairs(
  transformation: MappingTransformation,
): MappingPair[] {
  const flat: Record<string, string> = flatten(transformation);

  return Object.entries(flat).reduce<MappingPair[]>(
    (mappingPairs, [requiredKey, mappingTransformation]) => {
      const inputs: string[] = getinputs(
        `{"${requiredKey}": ${mappingTransformation}}`,
      ).getInputs({});
      const uniqueInputs = inputs.filter(
        (key, index) => inputs.lastIndexOf(key) === index,
      );

      const mappingPair: MappingPair = {
        creationType: MappingPairType.MANUAL,
        providedAttributeIds: uniqueInputs,
        requiredAttributeId: requiredKey,
        mappingTransformation,
      };

      return [...mappingPairs, mappingPair];
    },
    [],
  );
}
// #endregion
