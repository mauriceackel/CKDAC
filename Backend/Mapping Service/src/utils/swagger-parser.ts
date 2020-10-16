import deepcopy from 'deepcopy';
import SwaggerParser from "@apidevtools/swagger-parser";
import { IOpenApiOperation } from '../models/OperationModel';
import { OpenAPIV3, OpenAPIV2 } from 'openapi-types';


export async function getResponseSchema(searchOperation: IOpenApiOperation) {
  const apiSpec = JSON.parse(searchOperation.api.apiSpec);
  const apiObject = await SwaggerParser.validate(deepcopy(apiSpec), { validate: { spec: false } }) as OpenAPIV3.Document | OpenAPIV2.Document;

  //Iterate all pathes
  for (const url in apiObject.paths) {
    let path = apiObject.paths[url] as OpenAPIV3.PathItemObject | OpenAPIV2.PathItemObject;

    //Iterate all operations in a path
    for (const op in path) {
      const property = op as keyof OpenAPIV3.PathItemObject & keyof OpenAPIV2.PathItemObject;
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
              const v3Content = (response as OpenAPIV3.ResponseObject).content && (response as OpenAPIV3.ResponseObject).content!["application/json"]["schema"];

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

export async function getRequestSchema(searchOperation: IOpenApiOperation, ignoreOptional: boolean = false) {
  const apiSpec = JSON.parse(searchOperation.api.apiSpec);
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
            }, {} as { [key: string]: string });
          if (Object.keys(parameters).length !== 0) {
            result.parameters = removeTypes(flattenSchema({ type: "object", properties: parameters }));
          }

          //Iterate all responses in the matching operation
          for (const res in operation.responses) {

            //Filter for response which matches the searched response id
            if (res == searchOperation.responseId) {

              const params = operation.parameters as OpenAPIV2.InBodyParameterObject[];
              const bodyParameter = params && params.filter(p => p.in === "body");
              const v2Content = bodyParameter && bodyParameter.length > 0 && { type: "object", properties: bodyParameter.reduce((obj, e) => { obj[e.name] = e.schema; return obj }, {} as { [key: string]: OpenAPIV2.Schema }) };

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

function removeTypes(schema: any): any {
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
