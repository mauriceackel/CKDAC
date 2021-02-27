import { IMappingPair, MappingPairType } from "../models/MappingModel";
const getinputs = require('./get-inputs/get-inputs');

/**
 * Creates an array of mapping pairs from an jsonata input
 * @param transformation The JSONata transformation as object
 */
export function transToMappingPairs(transformation: Record<string, any>, keyChain: Array<string> = []): Array<IMappingPair> {
    const result = new Array<IMappingPair>();

    for (const key in transformation) {
        if (typeof transformation[key] === "object" && !(transformation[key] instanceof Array)) {
            result.push(...transToMappingPairs(transformation[key], [...keyChain, key]));
        } else {
            const inputs: string[] = getinputs(`{"${key}": ${transformation[key]}}`).getInputs({});
            const uniqueInputs = inputs.filter((k, i) => inputs.lastIndexOf(k) === i);
            const pair: IMappingPair = {
                creationType: MappingPairType.MAPPING,
                providedAttributeIds: uniqueInputs,
                requiredAttributeId: [...keyChain, key].join('.'),
                mappingTransformation: transformation[key]
            }
            result.push(pair);
        }
    }

    return result;
}