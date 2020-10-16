import { Injectable } from "@angular/core";
import { flatten } from 'flat';
import { IOpenApiMapping } from '../models/openapi-mapping.model';
import { AuthenticationService } from './auth/authentication.service';
import { IAsyncApiMapping } from '../models/asyncapi-mapping.model';
import { IAsyncApiInterface, IOpenApiInterface } from '../models/api-interface.model';
import { IMappingPair, MappingType, MappingDirection, IMapping } from '../models/mapping.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '~/environments/environment';
import { MappingResponse } from '../utils/responses/mapping-response';
import { ApiType } from '../models/api.model';
import { buildJSONataKey } from '../utils/jsonata-helpers';
import { mappingPairsToTrans } from '../utils/mapping-pairs';
import { ApiResponse } from '../utils/responses/api-response';

const host = environment.backendBaseUrl;
const mappingServiceUrl = `${host}/mappings`;
const mappingGenerationUrl = `${mappingServiceUrl}/generate`;

@Injectable({
  providedIn: 'root'
})
export class MappingService {

  constructor(
    private identificationService: AuthenticationService,
    private httpClient: HttpClient,
  ) { }

  // --------------- External Service Calls --------------- //
  public async getMappings(type?: MappingType): Promise<Array<IMapping>> {
    const response = await this.httpClient.get<MappingResponse>(`${mappingServiceUrl}${type ? `?type=${type}` : ''}`).toPromise();

    return response.result.mappings || [];
  }

  public async getMapping(mappingId: string): Promise<IMapping> {
    const response = await this.httpClient.get<MappingResponse>(`${mappingServiceUrl}/${mappingId}`).toPromise();

    return response.result.mapping;
  }

  public async upsertMapping(mapping: Partial<IMapping>) {
    if (mapping.id) {
      const response = await this.httpClient.put<ApiResponse>(`${mappingServiceUrl}/${mapping.id}`, mapping).toPromise();
      return;
    }

    const response = await this.httpClient.post<MappingResponse>(`${mappingServiceUrl}`, mapping).toPromise();
    return;
  }

  public async deleteMapping(mappingId: string) {
    const response = await this.httpClient.delete<ApiResponse>(`${mappingServiceUrl}/${mappingId}`).toPromise();
    return;
  }

  public async generateMapping<T extends IOpenApiInterface | IAsyncApiInterface>(source: T, targets: { [key: string]: T }, direction?: MappingDirection): Promise<T extends IOpenApiInterface ? IOpenApiMapping : IAsyncApiMapping> {
    const response = await this.httpClient.post<MappingResponse>(`${mappingGenerationUrl}`, {
      source,
      targets,
      direction
    }).toPromise();
    return response.result.mapping as (T extends IOpenApiInterface ? IOpenApiMapping : IAsyncApiMapping);
  }


  // --------------- Internal Service Calls --------------- //

  /**
   * Creates a mapping based on the input parameters
   * @param source The source interface
   * @param target The target interface
   * @param requestMappingPairs The mapping pairs of the request (source->target)
   * @param responseMappingPairs The mapping pairs of the response (target->source)
   */
  public buildOpenApiMapping(source: IOpenApiInterface, targets: { [key: string]: IOpenApiInterface }, requestMappingPairs: Array<IMappingPair>, responseMappingPairs: Array<IMappingPair>): IOpenApiMapping {
    const requestTransformation = mappingPairsToTrans(requestMappingPairs);
    const responseTransformation = mappingPairsToTrans(responseMappingPairs);

    return {
      id: undefined,
      createdBy: this.identificationService.AuthUser.id,
      apiType: ApiType.OPEN_API,
      type: MappingType.TRANSFORMATION,
      sourceId: `${source.api.id}_${source.operationId}_${source.responseId}`,
      targetIds: Object.keys(targets),
      requestMapping: JSON.stringify(requestTransformation),
      responseMapping: JSON.stringify(responseTransformation)
    }
  }

  /**
   * Creates a mapping based on the input parameters
   * @param source The source interface
   * @param targets The target interface
   * @param messageMappingPairs The mapping pairs of the mapping
   * @param direction input if source is required, outpur, if target is required
   */
  public buildAsyncApiMapping(source: IAsyncApiInterface, targets: { [key: string]: IAsyncApiInterface }, messageMappingPairs: Array<IMappingPair>, direction: MappingDirection): IAsyncApiMapping {
    const clusteredMappingPairs: { [key: string]: Array<IMappingPair> } = {};

    if (direction === MappingDirection.INPUT) {
      //target = provided
      for (const mappingPair of messageMappingPairs) {
        clusteredMappingPairs[mappingPair.provided[0][0]] = [...(clusteredMappingPairs[mappingPair.provided[0][0]] || []), mappingPair]
      }
    } else if (direction === MappingDirection.OUTPUT) {
      //target = required
      for (const mappingPair of messageMappingPairs) {
        clusteredMappingPairs[mappingPair.required[0]] = [...(clusteredMappingPairs[mappingPair.required[0]] || []), mappingPair]
      }
    }

    const messageMappings = Object.keys(targets).reduce((result, targetId) => {
      return {
        ...result,
        [targetId]: JSON.stringify(mappingPairsToTrans(clusteredMappingPairs[targetId] || []))
      }
    }, {})

    return {
      id: undefined,
      createdBy: this.identificationService.AuthUser.id,
      type: MappingType.TRANSFORMATION,
      apiType: ApiType.ASYNC_API,
      sourceId: `${source.api.id}_${source.operationId}`,
      targetIds: Object.keys(targets),
      topics: {
        source: source.url,
        targets: Object.entries(targets).reduce((obj, [targetId, value]) => ({ ...obj, [targetId]: value.url }), {})
      },
      servers: {
        source: source.server,
        targets: Object.entries(targets).reduce((obj, [targetId, value]) => ({ ...obj, [targetId]: value.server }), {})
      },
      messageMappings,
      direction
    }
  }

  /**
   * Function that builds mapping pairs for keys in provided and required that are identical
   *
   * @param provided The provided interface
   * @param required The reuired interface
   * @param split If set to true, multiple similar keys are not combined into a single mapping. Instead each pair is outputted as individual mapping.
   */
  public buildSameMappingPairs(provided: any, required: any, split: boolean = false): Array<IMappingPair> {
    if (split) {
      return this.buildSameMappingPairsSplit(provided, required);
    } else {
      return this.buildSameMappingPairsNoSplit(provided, required);
    }
  }

  private buildSameMappingPairsNoSplit(provided: any, required: any) {
    const mappingPairs = new Map<string, IMappingPair>();

    const flatProvided = flatten(provided);
    const flatRequired = flatten(required);

    for (const providedKey of Object.keys(flatProvided)) {
      for (const requiredKey of Object.keys(flatRequired)) {
        const unprefixedProvidedKey = providedKey.substr(providedKey.indexOf('.') + 1);
        const unprefixedRequiredKey = requiredKey.substr(requiredKey.indexOf('.') + 1);

        if (unprefixedProvidedKey === unprefixedRequiredKey) {
          let mappingPair: IMappingPair;
          if (mappingPairs.has(requiredKey)) {
            const existingPair = mappingPairs.get(requiredKey);
            mappingPair = {
              mappingCode: "",
              provided: [...existingPair.provided, providedKey.split('.')],
              required: existingPair.required
            }
          } else {
            mappingPair = {
              mappingCode: buildJSONataKey(providedKey.split('.')),
              provided: [providedKey.split('.')],
              required: requiredKey.split('.')
            }
          }
          mappingPairs.set(requiredKey, mappingPair);
        }
      }
    }

    return [...mappingPairs.values()];
  }

  private buildSameMappingPairsSplit(provided: any, required: any) {
    const mappingPairs = new Array<IMappingPair>();

    const flatProvided = flatten(provided);
    const flatRequired = flatten(required);

    for (const providedKey of Object.keys(flatProvided)) {
      for (const requiredKey of Object.keys(flatRequired)) {
        const unprefixedProvidedKey = providedKey.substr(providedKey.indexOf('.') + 1);
        const unprefixedRequiredKey = requiredKey.substr(requiredKey.indexOf('.') + 1);

        if (unprefixedProvidedKey === unprefixedRequiredKey) {
          const mappingPair = {
            mappingCode: buildJSONataKey(providedKey.split('.')),
            provided: [providedKey.split('.')],
            required: requiredKey.split('.')
          }
          mappingPairs.push(mappingPair);
        }
      }
    }

    return mappingPairs;
  }

}
