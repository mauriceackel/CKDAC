import { ApiType } from "../../models/ApiModel";

export enum AdapterType {
    JAVASCRIPT = "javascript",
}

export const SupportedAdapters: Map<ApiType, Array<AdapterType>> = new Map<ApiType, Array<AdapterType>>([
    [
        ApiType.OPEN_API, [
            AdapterType.JAVASCRIPT,
        ]
    ],
    [
        ApiType.ASYNC_API, [
            AdapterType.JAVASCRIPT,
        ]
    ],
]);