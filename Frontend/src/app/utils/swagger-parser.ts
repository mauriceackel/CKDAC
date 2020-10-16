import * as deepcopy from 'deepcopy';
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import * as SwaggerParser from 'swagger-parser';
import { IApi } from '../models/api.model';
import { IOpenApiInterface } from '../models/api-interface.model';

export async function getServer(api: IApi) {
  const apiSpec = JSON.parse(api.apiSpec);
  const apiObject = await SwaggerParser.validate(deepcopy(apiSpec), { validate: { spec: false } });

  switch (true) {
    case !!apiSpec.swagger && apiSpec.swagger.startsWith('2'): {
      const apiV2 = apiObject as OpenAPIV2.Document;
      return `${apiV2.host}${apiV2.basePath || ''}`;
    };
    case !!apiSpec.openapi && apiSpec.openapi.startsWith('3'): {
      const apiV3 = apiObject as OpenAPIV3.Document;
      const server = apiV3.servers[0];
      const url = Object.entries(server.variables || []).reduce((url, [varname, value]) => url.replace(new RegExp(`{${varname}}`, 'g'), value.default), server.url);
      return url;
    };
  }
}

export async function getRequestUrls(ifaces: { [key: string]: IOpenApiInterface }, paramValues: { [key: string]: { parameters: { [key: string]: string } } } = {}) {
  return Promise.all(Object.entries(ifaces).map(([key, value]) => getRequestUrl(value, paramValues[key]?.parameters)));
}

export async function getRequestUrl(iface: IOpenApiInterface, paramValues: { [key: string]: string } = {}) {
  const server = await getServer(iface.api);
  const { url, method, path, operation } = await getOperation(iface.api, iface.operationId);

  //Get all required parameters
  const parameters = ([...path.parameters || [], ...operation.parameters || []] as (OpenAPIV3.ParameterObject | OpenAPIV2.InBodyParameterObject | OpenAPIV2.GeneralParameterObject)[])

  const query = parameters.filter(p => p.in === "query").map(p => paramValues[p.name] && `${p.name}=${paramValues[p.name]}`).filter(Boolean).join('&');
  const urlWithParams = parameters.filter(p => p.in === "path").reduce((currUrl, currParam) => currUrl.replace(new RegExp(`{${currParam.name}}`, 'g'), paramValues[currParam.name] || ''), url);

  return { method, url: `${server}${urlWithParams}${query ? '?' + query : ''}` }
}

export async function getOperationTemplates(api: IApi) {
  let operationTemplates: IOpenApiOperationTemplate[] = [];
  const apiSpec = JSON.parse(api.apiSpec);
  const apiObject = await SwaggerParser.validate(deepcopy(apiSpec), { validate: { spec: false } }) as OpenAPIV3.Document;

  for (const url in apiObject.paths) {
    let path = apiObject.paths[url];
    for (const op in path) {
      let property = op as keyof OpenAPIV3.PathItemObject;
      if (["get", "post", "delete", "put", "patch", "trace", "head", "options"].includes(property)) {
        let operation = path[property] as OpenAPIV3.OperationObject;

        let operationTemplate = { operationId: operation.operationId, responseIds: new Array<string>() };
        for (const response in operation.responses) {
          operationTemplate.responseIds.push(response);
        }

        operationTemplates.push(operationTemplate);
      }
    }
  }

  return operationTemplates;
}

function getResponses(operationTemplates: IOpenApiOperationTemplate[], operationId: string | undefined) {
  return operationTemplates?.find(t => t.operationId == operationId)?.responseIds;
}

export async function getOperation(api: IApi, operationId: string) {
  const apiSpec = JSON.parse(api.apiSpec);
  const apiObject = await SwaggerParser.validate(deepcopy(apiSpec), { validate: { spec: false } }) as OpenAPIV3.Document;

  //Iterate all pathes
  for (const url in apiObject.paths) {
    const path = apiObject.paths[url];

    //Iterate all operations in a path
    for (const op in path) {
      const property = op as keyof OpenAPIV3.PathItemObject;
      if (["get", "post", "delete", "put", "patch", "trace", "head", "options"].includes(property)) {
        const operation = path[property] as OpenAPIV3.OperationObject;

        //Filter for an operation that matches the searchOperation id
        if (operation.operationId == operationId) {
          return { method: property, url, path, operation };
        }
      }
    }
  }

  return undefined;
}

export async function getResponseSchema(api: IApi, searchOperation: IOpenApiOperation) {
  const apiSpec = JSON.parse(api.apiSpec);
  const apiObject = await SwaggerParser.validate(deepcopy(apiSpec), { validate: { spec: false } }) as OpenAPIV3.Document | OpenAPIV2.Document;

  //Iterate all pathes
  for (const url in apiObject.paths) {
    let path = apiObject.paths[url] as OpenAPIV3.PathItemObject | OpenAPIV2.PathItemObject;

    //Iterate all operations in a path
    for (const op in path) {
      const property = op as keyof OpenAPIV3.PathItemObject | keyof OpenAPIV2.PathItemObject;
      if (["get", "post", "delete", "put", "patch", "trace", "head", "options"].includes(property)) {
        const operation = path[property] as OpenAPIV3.OperationObject | OpenAPIV2.OperationObject;

        //Filter for an operation that matches the searchOperation id
        if (operation.operationId == searchOperation.operationId) {

          //Iterate all responses in the matching operation
          for (const res in operation.responses) {

            //Filter for response which matches the searched response id
            if (res == searchOperation.responseId) {
              const response = operation.responses[res] as OpenAPIV3.ResponseObject | OpenAPIV2.ResponseObject;

              const v2Content = (response as OpenAPIV2.ResponseObject).schema;
              const v3Content = (response as OpenAPIV3.ResponseObject).content && (response as OpenAPIV3.ResponseObject).content["application/json"]["schema"];

              const jsonResponse = v2Content || v3Content || {};
              return removeTypes(flattenSchema(jsonResponse));
            }
          }
        }
      }
    }
  }

  return undefined;
}

export async function getRequestSchema(api: IApi, searchOperation: IOpenApiOperation, ignoreOptional: boolean = false) {
  const apiSpec = JSON.parse(api.apiSpec);
  const apiObject = await SwaggerParser.validate(deepcopy(apiSpec), { validate: { spec: false } }) as OpenAPIV3.Document | OpenAPIV2.Document;

  const result = {} as any;

  //Iterate all pathes
  for (const url in apiObject.paths) {
    const path = apiObject.paths[url];

    //Iterate all operations in a path
    for (const op in path) {
      const property = op as keyof OpenAPIV3.PathItemObject | keyof OpenAPIV2.PathItemObject;
      if (["get", "post", "delete", "put", "patch", "trace", "head", "options"].includes(property)) {
        const operation = path[property] as OpenAPIV3.OperationObject | OpenAPIV2.OperationObject;

        //Filter for an operation that matches the searchOperation id
        if (operation.operationId == searchOperation.operationId) {

          //Get all required parameters
          const parameters = ([...path.parameters || [], ...operation.parameters || []] as (OpenAPIV3.ParameterObject | OpenAPIV2.InBodyParameterObject | OpenAPIV2.GeneralParameterObject)[])
            .filter(p => p.in !== "body" && (!ignoreOptional || p.in === "path" || p.required))
            .reduce((prev, curr) => {
              prev[curr.name] = curr.schema;
              return prev;
            }, {});
          if (Object.keys(parameters).length !== 0) {
            result.parameters = removeTypes(flattenSchema({ type: "object", properties: parameters }));
          }

          //Iterate all responses in the matching operation
          for (const res in operation.responses) {

            //Filter for response which matches the searched response id
            if (res == searchOperation.responseId) {

              const params = operation.parameters as OpenAPIV2.InBodyParameterObject[];
              const bodyParameter = params && params.filter(p => p.in === "body");
              const v2Content = bodyParameter && bodyParameter.length > 0 && { type: "object", properties: bodyParameter.reduce((obj, e) => { obj[e.name] = e.schema; return obj }, {}) };

              const body = operation.requestBody as OpenAPIV3.RequestBodyObject;
              const v3Content = body && (body as OpenAPIV3.RequestBodyObject).content && (body as OpenAPIV3.RequestBodyObject).content["application/json"]["schema"];

              const jsonBody = v2Content || v3Content;

              if (jsonBody) {
                result.body = removeTypes(flattenSchema(jsonBody));
              }
              return result;
            }
          }
        }
      }
    }
  }

  return undefined;
}

function removeTypes(schema: any) {
  if (schema["type"] == "object") {
    for (const key in schema.properties) {
      schema.properties[key] = removeTypes(schema.properties[key])
    }
    return schema.properties || {};
  } else if (schema["type"] == "array") {
    return [removeTypes(schema.items)];
  } else {
    return schema["type"];
  }
}

function flattenSchema(schema: any) {
  if (schema["allOf"] != undefined) {
    let combination: any = {
      type: "object",
      properties: {}
    }
    for (const child of schema["allOf"]) {
      combination.properties = {
        ...combination.properties,
        ...flattenSchema(child).properties
      }
    }
    return combination;
  } else {
    return schema;
  }
}

export interface IOpenApiOperationTemplate {
  operationId: string,
  responseIds: Array<string>
}

export interface IOpenApiOperation {
  operationId: string,
  responseId: string | undefined
}
