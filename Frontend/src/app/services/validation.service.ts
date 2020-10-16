import { Injectable } from "@angular/core";
import { IOpenApiInterface } from '../models/api-interface.model';
import { IOpenApiMapping } from '../models/openapi-mapping.model';
import { OpenApiValidationError, AsyncApiValidationError } from '../utils/errors/validation-error';
import { getRequestSchema, getResponseSchema } from '../utils/swagger-parser';
import { flatten } from 'flat';
import { KeyChain } from '../utils/json-tree';
import { IAsyncApiInterface } from '../models/api-interface.model';
import { getMessageSchema } from '../utils/asyncapi-parser';
import { IAsyncApiMapping } from '../models/asyncapi-mapping.model';
import { MappingDirection } from '../models/mapping.model';

@Injectable({
  providedIn: "root"
})
export class ValidationService {

  public async getSourceResponseBody(source: IOpenApiInterface) {
    const { api: srcApi, ...srcOperation } = source;
    return {
      [`${srcApi.id}_${srcOperation.operationId}_${srcOperation.responseId}`]: await getResponseSchema(srcApi, srcOperation)
    }
  }

  public async getTargetRequestBodies(targets: { [key: string]: IOpenApiInterface }) {
    const schemaPromises = Object.entries(targets || {}).map(async ([key, value]) => ({ key, schema: await getRequestSchema(value.api, { operationId: value.operationId, responseId: value.responseId }, true) }));
    return (await Promise.all(schemaPromises)).reduce((obj, { key, schema }) => ({ ...obj, [key]: schema }), {});
  }

  public async getSourceMessageBody(source: IAsyncApiInterface) {
    const { api: srcApi, ...srcOperation } = source;
    return {
      [`${srcApi.id}_${srcOperation.operationId}`]: await getMessageSchema(srcApi, srcOperation)
    }
  }

  public async getTargetMessageBodies(targets: { [key: string]: IAsyncApiInterface }) {
    const schemaPromises = Object.entries(targets || {}).map(async ([key, value]) => ({ key, schema: await getMessageSchema(value.api, { operationId: value.operationId }, true) }));
    return (await Promise.all(schemaPromises)).reduce((obj, { key, schema }) => ({ ...obj, [key]: schema }), {});
  }

  public async validateOpenApiMappingComplete(source: IOpenApiInterface, targets: { [key: string]: IOpenApiInterface }, mapping: IOpenApiMapping) {
    const [sourceResponseBody, targetRequestBodies] = await Promise.all([
      this.getSourceResponseBody(source),
      this.getTargetRequestBodies(targets)
    ])

    return this.validateOpenApiMapping(mapping, sourceResponseBody, targetRequestBodies);
  }

  public validateOpenApiMapping(mapping: IOpenApiMapping, sourceResponseBody: any, targetRequestBodies: any) {
    const missingRequest = this.findMissing(JSON.parse(mapping.requestMapping), targetRequestBodies);
    const missingResponse = this.findMissing(JSON.parse(mapping.responseMapping), sourceResponseBody);

    if (missingRequest.length > 0 || missingResponse.length > 0) {
      let errorMessage = ""
      if (missingRequest.length > 0 && missingResponse.length < 1) {
        errorMessage = "Missing request mappings " + missingRequest.map(m => m.join('.')).join(', ')
      }
      if (missingRequest.length < 1 && missingResponse.length > 0) {
        errorMessage = " Missing response mappings " + missingResponse.map(m => m.join('.')).join(', ')
      }
      if (missingRequest.length > 0 && missingResponse.length > 0) {
        errorMessage = "Missing request mappings\n" + missingRequest.map(m => m.join('.')).join(', ') + "\n\nMissing response mappings\n" + missingResponse.map(m => m.join('.')).join(', ')
      }
      throw new OpenApiValidationError(errorMessage, missingRequest, missingResponse);
    }
  }

  public async validateAsyncApiMappingComplete(source: IAsyncApiInterface, targets: { [key: string]: IAsyncApiInterface }, mapping: IAsyncApiMapping, direction: MappingDirection) {
    const missing: KeyChain[] = [];

    if (direction === MappingDirection.INPUT) {
      // source = consumer & targets = consumer
      // All source-props need to be mapped for every target's props
      const sourceBody = await this.getSourceMessageBody(source);
      for (const targetId of Object.keys(targets)) {
        missing.push(...this.findMissing(JSON.parse(mapping.messageMappings[targetId] || "{}"), sourceBody));
      }
    } else if (direction === MappingDirection.OUTPUT) {
      // source = producer & targets = producer
      // Each target-prop needs to be mapped
      const targetBodies = await this.getTargetMessageBodies(targets);
      for (const targetId of Object.keys(targets)) {
        //We only require a match for one specific targetId, but we need to prefix it again so that the keys match
        const required = { [targetId]: targetBodies[targetId] };
        missing.push(...this.findMissing(JSON.parse(mapping.messageMappings[targetId] || "{}"), required));
      }
    }

    if (missing.length > 0) {
      const errorMessage = "Missing message mappings\n" + missing.map(m => m.join('.')).join(', ');
      throw new AsyncApiValidationError(errorMessage, missing);
    }
  }

  //Returns properties that are in required but not in provided
  public findMissing(provided: any, required: any, keyChain: KeyChain = []): Array<KeyChain> {
    let result = new Array<KeyChain>();

    const providedKeys = Object.entries(flatten(provided))
      .filter(([, val]) => typeof val !== 'object')
      .map(([key,]) => key);
    const requiredKeys = Object.entries(flatten(required))
      .filter(([, val]) => typeof val !== 'object')
      .map(([key,]) => key);

    for (const requiredKey of requiredKeys) {
      if (!providedKeys.includes(requiredKey)) {
        result.push(requiredKey.split('.'));
      }
    }

    return result;
  }

}
