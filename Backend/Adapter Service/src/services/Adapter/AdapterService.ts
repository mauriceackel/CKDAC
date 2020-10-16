import { IAsyncApiMapping, IMapping, IOpenApiMapping } from "../../models/MappingModel";
import * as OpenApiAdapterService from './OpenApiAdapterService';
import * as AsyncApiAdapterService from './AsyncApiAdapterService';
import { ApiType } from "../../models/ApiModel";
import { NoSuchElementError } from "../../utils/errors/NoSuchElementError";
import { AdapterType } from "../../utils/enums/AdapterTypes";


export async function createAdapter(adapterType: AdapterType, mapping: IMapping, userId: string): Promise<string> {
    switch (mapping.apiType) {
        case ApiType.OPEN_API: return OpenApiAdapterService.createAdapter(adapterType, mapping as IOpenApiMapping, userId);
        case ApiType.ASYNC_API: return AsyncApiAdapterService.createAdapter(adapterType, mapping as IAsyncApiMapping, userId);
        default: throw new NoSuchElementError("Unknown api type");
    }
}
