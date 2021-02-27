import { IMapping } from "../../models/MappingModel";
import { MappingGenerationResult } from "../../services/MappingGenerator/MappingGeneratorService";
import { SuccessResponse } from "./ApiResponse";

export class MappingGenerationResponse extends SuccessResponse {
    public get Result(): MappingGenerationResult {
        return this.result;
    }
    protected result: MappingGenerationResult;

    constructor(code: number, messages: Array<string> = [], result: MappingGenerationResult) {
        super(code, messages);
        this.result = result;
    }
}
