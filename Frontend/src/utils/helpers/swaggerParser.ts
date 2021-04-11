/* eslint-disable @typescript-eslint/no-use-before-define */
import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenApiModel } from 'models/ApiModel';
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { flattenSchema, removeTypes, Schema } from './schemaHelpers';

// #region Types & constants
export type OpenApiOperation = {
  api: OpenApiModel;
  operationId: string;
  responseId: string;
};

export const httpMethods = [
  'get',
  'post',
  'delete',
  'put',
  'patch',
  'trace',
  'head',
  'options',
];
// #endregion

export async function parseApiSpec(apiSpec: string): Promise<OpenAPI.Document> {
  const apiSpecObject = JSON.parse(apiSpec);

  return SwaggerParser.validate(apiSpecObject, { validate: { spec: false } });
}

// #region Get operations details
function getOperation<T extends OpenAPIV2.Document | OpenAPIV3.Document>(
  apiObject: T,
  operationId: string,
):
  | {
      path: T extends OpenAPIV2.Document
        ? OpenAPIV2.PathItemObject
        : OpenAPIV3.PathItemObject;
      method: string;
      pathUrl: string;
      operation: T extends OpenAPIV2.Document
        ? OpenAPIV2.OperationObject
        : OpenAPIV3.OperationObject;
    }
  | undefined {
  const pathObjects: [
    string,
    T extends OpenAPIV2.Document
      ? OpenAPIV2.PathItemObject
      : OpenAPIV3.PathItemObject,
  ][] = Object.entries(apiObject.paths);

  for (let i = 0; i < pathObjects.length; i += 1) {
    const [pathUrl, pathObject] = pathObjects[i];
    const operationObjects: [
      string,
      T extends OpenAPIV2.Document
        ? OpenAPIV2.OperationObject
        : OpenAPIV3.OperationObject,
    ][] = Object.entries(pathObject);

    for (let j = 0; j < operationObjects.length; j += 1) {
      const [method, operationObject] = operationObjects[j];

      if (operationObject.operationId === operationId) {
        return {
          path: pathObject,
          pathUrl,
          method,
          operation: operationObject,
        };
      }
    }
  }

  return undefined;
}

export function getOperationIds(apiObject: OpenAPI.Document): string[] {
  return Object.values(apiObject.paths).flatMap(
    (pathObject: OpenAPIV3.PathItemObject | OpenAPIV2.PathItemObject) => {
      return Object.entries(pathObject)
        .filter(([key]) => httpMethods.includes(key))
        .map(([, operation]) => {
          return operation.operationId;
        });
    },
  );
}

export function getResponseCodes(
  apiObject: OpenAPI.Document,
  operationId: string,
): string[] {
  const { operation } = getOperation(apiObject, operationId) ?? {};

  if (!operation?.responses) {
    return [];
  }

  return Object.keys(operation.responses);
}
// #endregion

// #region Get server details
function getServersV2(apiObject: OpenAPIV2.Document): string[] | undefined {
  return apiObject.schemes?.map(
    (scheme) => scheme + apiObject.host + apiObject.basePath,
  );
}

function getServersV3(apiObject: OpenAPIV3.Document): string[] | undefined {
  return apiObject.servers?.map((server) => {
    return Object.entries(server.variables || []).reduce(
      (url, [varname, value]) =>
        url.replace(new RegExp(`{${varname}}`, 'g'), value.default),
      server.url,
    );
  });
}
// #endregion

// #region Request schema
export function getRequestSchema(
  apiObject: OpenAPI.Document,
  operationId: string,
  ignoreOptional = false,
): Schema | undefined {
  const result = getOperation(apiObject, operationId);
  if (result === undefined) {
    return undefined;
  }

  const { path, operation } = result;

  // V3
  if (isOpenApiV3(apiObject)) {
    const parameters = getV3Parameters(
      path as OpenAPIV3.PathItemObject,
      operation as OpenAPIV3.OperationObject,
      ignoreOptional,
    );
    const body = getV3RequestBody(operation as OpenAPIV3.OperationObject);

    return {
      ...(parameters
        ? {
            parameters: removeTypes(
              flattenSchema({ type: 'object', properties: parameters }),
            ),
          }
        : null),
      ...(body && Object.keys(body).length
        ? { body: removeTypes(flattenSchema(body)) }
        : null),
    };
  }

  // V2
  const parameters = getV2Parameters(
    path as OpenAPIV2.PathItemObject,
    operation as OpenAPIV2.OperationObject,
    ignoreOptional,
  );
  const body = getV2RequestBody(operation as OpenAPIV2.OperationObject);

  return {
    ...(parameters
      ? {
          parameters: removeTypes(
            flattenSchema({ type: 'object', properties: parameters }),
          ),
        }
      : null),
    ...(body && Object.keys(body).length
      ? { body: removeTypes(flattenSchema(body)) }
      : null),
  };
}

function getV2Parameters(
  pathObject: OpenAPIV2.PathItemObject,
  operationObject: OpenAPIV2.OperationObject,
  ignoreOptional: boolean,
) {
  const combinedParameters = [
    ...(pathObject.parameters ?? []),
    ...(operationObject.parameters ?? []),
  ] as (OpenAPIV2.InBodyParameterObject | OpenAPIV2.GeneralParameterObject)[];

  const filteredParameters = combinedParameters.filter(
    (parameter) =>
      parameter.in !== 'body' &&
      (!ignoreOptional || parameter.in === 'path' || parameter.required),
  );

  if (filteredParameters.length === 0) {
    return undefined;
  }

  return filteredParameters.reduce<Record<string, any>>(
    (obj, parameter) => ({
      ...obj,
      [parameter.name]: parameter.schema,
    }),
    {},
  );
}

function getV3Parameters(
  pathObject: OpenAPIV3.PathItemObject,
  operationObject: OpenAPIV3.OperationObject,
  ignoreOptional: boolean,
) {
  const combinedParameters = [
    ...(pathObject.parameters ?? []),
    ...(operationObject.parameters ?? []),
  ] as OpenAPIV3.ParameterObject[];

  const filteredParameters = combinedParameters.filter(
    (parameter) =>
      parameter.in !== 'body' &&
      (!ignoreOptional || parameter.in === 'path' || parameter.required),
  );

  if (filteredParameters.length === 0) {
    return undefined;
  }

  return filteredParameters.reduce<Record<string, any>>(
    (obj, parameter) => ({
      ...obj,
      [parameter.name]: parameter.schema,
    }),
    {},
  );
}

function getV2RequestBody(operationObject: OpenAPIV2.OperationObject) {
  const params = operationObject.parameters as OpenAPIV2.InBodyParameterObject[];
  const bodyParameters = params?.filter((parameter) => parameter.in === 'body');

  return {
    type: 'object',
    properties:
      bodyParameters?.reduce(
        (obj, parameter) => ({
          ...obj,
          [parameter.name]: parameter.schema,
        }),
        {},
      ) ?? {},
  };
}

function getV3RequestBody(operationObject: OpenAPIV3.OperationObject) {
  const requestBody = operationObject.requestBody as
    | OpenAPIV3.RequestBodyObject
    | undefined;

  return requestBody?.content?.['application/json'].schema;
}
// #endregion

// #region Response schema
export function getResponseSchema(
  apiObject: OpenAPI.Document,
  operationId: string,
  responseId: string,
): Schema | undefined {
  const result = getOperation(apiObject, operationId);
  if (result === undefined) {
    return undefined;
  }

  const { operation } = result;

  // V3
  if (isOpenApiV3(apiObject)) {
    const body = getV3ResponseBody(
      operation as OpenAPIV3.OperationObject,
      responseId,
    );

    return removeTypes(flattenSchema(body ?? {}));
  }

  // V2
  const body = getV2ResponseBody(
    operation as OpenAPIV2.OperationObject,
    responseId,
  );

  return removeTypes(flattenSchema(body));
}

function getV2ResponseBody(
  operationObject: OpenAPIV2.OperationObject,
  responseId: string,
) {
  const response = operationObject.responses?.[responseId] as
    | OpenAPIV2.ResponseObject
    | undefined;

  return response?.schema;
}

function getV3ResponseBody(
  operationObject: OpenAPIV3.OperationObject,
  responseId: string,
) {
  const response = operationObject.responses?.[responseId] as
    | OpenAPIV3.ResponseObject
    | undefined;

  return response?.content?.['application/json'].schema;
}
// #endregion

// #region Request URL
export function getRequestUrl(
  apiObject: OpenAPI.Document,
  operationId: string,
  paramValues: Record<string, string> = {},
): { method: string; url: string } | undefined {
  const servers = isOpenApiV3(apiObject)
    ? getServersV3(apiObject)
    : getServersV2(apiObject);
  const operationResult = getOperation(apiObject, operationId);
  console.log(servers, apiObject, operationId, operationResult);

  if (!servers || servers.length === 0 || !operationResult) {
    return undefined;
  }

  const { pathUrl, method, path, operation } = operationResult;
  const server = servers[0];

  // Get all required parameters
  const parameters = [
    ...(path.parameters || []),
    ...(operation.parameters || []),
  ] as (
    | OpenAPIV3.ParameterObject
    | OpenAPIV2.InBodyParameterObject
    | OpenAPIV2.GeneralParameterObject
  )[];

  const query = parameters
    .filter((p) => p.in === 'query')
    .map((p) => paramValues[p.name] && `${p.name}=${paramValues[p.name]}`)
    .filter(Boolean)
    .join('&');
  const urlWithParams = parameters
    .filter((p) => p.in === 'path')
    .reduce(
      (currUrl, currParam) =>
        currUrl.replace(
          new RegExp(`{${currParam.name}}`, 'g'),
          paramValues[currParam.name] || '',
        ),
      pathUrl,
    );

  return {
    method,
    url: `${server}${urlWithParams}${query ? `?${query}` : ''}`,
  };
}
// #endregion

// #region Helpers
function isOpenApiV3(doc: any): doc is OpenAPIV3.Document {
  return doc.openapi !== undefined;
}
// #endregion
