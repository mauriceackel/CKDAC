import { IMapping } from "../../models/MappingModel";
import { MappingGenerationResult } from "../../services/MappingGenerator/MappingGeneratorService";
import { SuccessResponse } from "./ApiResponse";

export class MappedOperationsResponse extends SuccessResponse {
    public get Result(): { apiId: string, operationId: string }[] {
        return this.result;
    }
    protected result: { apiId: string, operationId: string }[];

    constructor(code: number, messages: Array<string> = [], result: { apiId: string, operationId: string }[]) {
        super(code, messages);
        this.result = result;
    }
}
