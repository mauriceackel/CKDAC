import { ApiType } from "../../models/ApiModel";
import { IMappingPair, MappingDirection } from "../../models/MappingModel";
import * as OpenApiGeneratorService from "./OpenApiMappingGenerator";
import * as AsyncApiGeneratorService from "./AsyncApiMappingGenerator";
import * as AttributeGeneratorService from "./AttributeMappingGenerator";
import { IAsyncApiOperation, IOpenApiOperation, IOperation } from "../../models/OperationModel";
import { mergeMappingPairs } from "../../utils/merge-mapping-pairs";

export type MappingGenerationResult = {
    type: ApiType.OPEN_API,
    mappingPairs: {
        request: IMappingPair[],
        response: IMappingPair[],
    }
} | {
    type: ApiType.ASYNC_API,
    mappingPairs: IMappingPair[]
}

/**
   * Create mapping pairs based on a source and target interface, taking transitive chains into account
   *
   * @param source The source interface
   * @param targets The target interfaces
   */
export async function generateMapping(source: IOperation, targets: { [key: string]: IOperation }, direction?: MappingDirection): Promise<MappingGenerationResult> {
    const type = source.api.type;
    if (Object.values(targets).some(target => target.api.type !== type)) {
        throw new Error("Mappings can only be generated between mappings of the same type");
    }

    const start = Date.now();
    switch (type) {
        case ApiType.OPEN_API: {
            const transitiveMappingResult = await OpenApiGeneratorService.generateMapping(source as IOpenApiOperation, targets as { [key: string]: IOpenApiOperation });
            const attributeMappingResult = await AttributeGeneratorService.generateMappingForOpenApi(source as IOpenApiOperation, targets as { [key: string]: IOpenApiOperation });
            const combinedMappingResult = {
                request: mergeMappingPairs(transitiveMappingResult.request, attributeMappingResult.request),
                response: mergeMappingPairs(transitiveMappingResult.response, attributeMappingResult.response),
            };
            
            const end = Date.now();
            console.log("Duration (ms):", end - start);
            return {
                type: ApiType.OPEN_API,
                mappingPairs: combinedMappingResult
            };
        };
        case ApiType.ASYNC_API: {
            if (direction === undefined) throw new Error("Parameter 'direction' is mandatory for async api");
            const transitiveMappingResult = await AsyncApiGeneratorService.generateMapping(source as IAsyncApiOperation, targets as { [key: string]: IAsyncApiOperation }, direction);
            const attributeMappingResult = await AttributeGeneratorService.generateMappingForAsyncApi(source as IAsyncApiOperation, targets as { [key: string]: IAsyncApiOperation }, direction);
            const combinedMappingResult = mergeMappingPairs(transitiveMappingResult, attributeMappingResult);
            
            const end = Date.now();
            console.log("Duration (ms):", end - start);
            return {
                type: ApiType.ASYNC_API,
                mappingPairs: combinedMappingResult
            };
        }
        default: throw new Error("Unknown mapping type while building mapping");
    }
}

export async function generateAttributeMappingOnly(source: IOperation, targets: { [key: string]: IOperation }, mappingPairs: IMappingPair[], direction?: MappingDirection): Promise<MappingGenerationResult> {
    const type = source.api.type;
    if (Object.values(targets).some(target => target.api.type !== type)) {
        throw new Error("Mappings can only be generated between mappings of the same type");
    }

    switch (type) {
        case ApiType.OPEN_API: {
            const attributeMappingResult = await AttributeGeneratorService.generateMappingForOpenApi(source as IOpenApiOperation, targets as { [key: string]: IOpenApiOperation }, mappingPairs);
            
            return {
                type: ApiType.OPEN_API,
                mappingPairs: attributeMappingResult
            };
        };
        case ApiType.ASYNC_API: {
            if (direction === undefined) throw new Error("Parameter 'direction' is mandatory for async api");
            const attributeMappingResult = await AttributeGeneratorService.generateMappingForAsyncApi(source as IAsyncApiOperation, targets as { [key: string]: IAsyncApiOperation }, direction, mappingPairs);
            
            return {
                type: ApiType.ASYNC_API,
                mappingPairs: attributeMappingResult
            };
        }
        default: throw new Error("Unknown mapping type while building mapping");
    }
}
