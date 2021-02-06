import { ApiType, IApi } from "../../models/ApiModel";
import { IMapping, MappingDirection } from "../../models/MappingModel";
import * as OpenApiGeneratorService from "./OpenApiMappingGenerator";
import * as AsyncApiGeneratorService from "./AsyncApiMappingGenerator";
import { IAsyncApiOperation, IOpenApiOperation, IOperation } from "../../models/OperationModel";

/**
   * Create mapping pairs based on a source and target interface, taking transitive chains into account
   *
   * @param source The source interface
   * @param targets The target interfaces
   */
export async function generateMapping(source: IOperation, targets: { [key: string]: IOperation }, direction?: MappingDirection): Promise<IMapping> {
    const type = source.api.type;
    if (Object.values(targets).some(target => target.api.type !== type)) {
        throw new Error("Mapings can only be generated between mappings of the same type");
    }

    const start = Date.now();
    switch (type) {
        case ApiType.OPEN_API: {
            const result = OpenApiGeneratorService.generateMapping(source as IOpenApiOperation, targets as { [key: string]: IOpenApiOperation });
            const end = Date.now();
            console.log("Duration (ms):", end - start);
            return result;
        };
        case ApiType.ASYNC_API: {
            if (direction === undefined) throw new Error("Parameter 'direction' is mandatory for async api");
            const result = AsyncApiGeneratorService.generateMapping(source as IAsyncApiOperation, targets as { [key: string]: IAsyncApiOperation }, direction);
            const end = Date.now();
            console.log("Duration (ms):", end - start);
            return result;
        }
        default: throw new Error("Unknown mapping type while building mapping");
    }
}
