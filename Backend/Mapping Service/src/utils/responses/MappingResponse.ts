import { IMapping } from "../../models/MappingModel";
import { SuccessResponse } from "./ApiResponse";

abstract class MappingResponse extends SuccessResponse {
    public get Result(): { mapping?: IMapping, mappings?: Array<IMapping> } {
        return this.result;
    }
    protected result: {
        mapping?: IMapping,
        mappings?: Array<IMapping>
    };

    constructor(code: number, messages: Array<string>) {
        super(code, messages);
        this.result = {};
    }
}

export class SingleMappingResponse extends MappingResponse {
    constructor(code: number, messages: Array<string> = [], mapping: IMapping) {
        super(code, messages);
        this.result.mapping = mapping;
    }
}

export class MultiMappingResponse extends MappingResponse {
    constructor(code: number, messages: Array<string> = [], mappings: Array<IMapping>) {
        super(code, messages);
        this.result.mappings = mappings;
    }
}