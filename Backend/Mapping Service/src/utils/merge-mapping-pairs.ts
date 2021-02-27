import { IMappingPair } from "../models/MappingModel";

export function mergeMappingPairs(...mappingPairs: IMappingPair[][]): IMappingPair[] {
    // Prevent duplicate mapping pairs, favour early parameter mapping pairs
    const uniqueMappingPairs = new Map<string, IMappingPair>();
    for(const mappingPairGroup of mappingPairs) {
        for(const mappingPair of mappingPairGroup) {
            if(!uniqueMappingPairs.has(mappingPair.requiredAttributeId)) {
                uniqueMappingPairs.set(mappingPair.requiredAttributeId, mappingPair);
            }
        }
    }

    return [...uniqueMappingPairs.values()];
}
