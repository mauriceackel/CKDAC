import { IAsyncApiMapping, IMapping, IOpenApiMapping, MappingType } from "../models/MappingModel";
import { flatten, unflatten } from 'flat';
import { buildJSONataKey } from "../utils/jsonata-helpers";
import { ApiType } from "../models/ApiModel";

/**
   * Creates a symmetrical, "reversed" mapping for a mapping that is about to be stored in the database.
   *
   * @param mapping The mapping that should be reversed
   */
export function reverseMapping(mapping: Omit<IMapping, "id">): Array<Omit<IMapping, "id">> {
    switch (mapping.apiType) {
        case ApiType.OPEN_API: return buildOpenApiReverseMappings(mapping as Omit<IOpenApiMapping, "id">);
        case ApiType.ASYNC_API: return buildAsyncApiReverseMappings(mapping as Omit<IAsyncApiMapping, "id">);
        default: throw new Error("Unknown mapping type while building reverse mapping");
    }
}

function buildOpenApiReverseMappings(mapping: Omit<IOpenApiMapping, "id">): Array<Omit<IOpenApiMapping, "id">> {
    return mapping.targetIds.map(targetId => ({
        apiType: ApiType.OPEN_API,
        sourceId: targetId,
        targetIds: [mapping.sourceId],
        createdBy: mapping.createdBy,
        type: MappingType.REVERSE,
        requestMapping: reverseTransformation([targetId, mapping.sourceId], mapping.requestMapping),
        responseMapping: reverseTransformation([targetId, mapping.sourceId], mapping.responseMapping)
    }));
}

function buildAsyncApiReverseMappings(mapping: Omit<IAsyncApiMapping, "id">): Array<Omit<IAsyncApiMapping, "id">> {
    return mapping.targetIds.map(targetId => ({
        apiType: ApiType.ASYNC_API,
        sourceId: targetId,
        targetIds: [mapping.sourceId],
        createdBy: mapping.createdBy,
        type: MappingType.REVERSE,
        topics: {
            source: mapping.topics.targets[targetId],
            targets: {
                [mapping.sourceId]: mapping.topics.source
            }
        },
        servers: {
            source: mapping.servers.targets[targetId],
            targets: {
                [mapping.sourceId]: mapping.servers.source
            }
        },
        messageMappings: { [mapping.sourceId]: reverseTransformation([targetId, mapping.sourceId], mapping.messageMappings[targetId]) },
        direction: mapping.direction
    }));
}

/**
   * Creates a reversed mapping for a given JSONata mapping
   *
   * @param prefixes The relevant source and or target IDs, used to filter out mappings
   * @param transformation The JSONata mapping that should be reverted
   */
function reverseTransformation(prefixes: string[], transformation: string): string {
    //Flatten out the parsed JSONata transformation
    const transformationObject: { [key: string]: string } = flatten(JSON.parse(transformation));

    //Loop over each entry in the JSONata mapping
    const reversedMapping = Object.entries(transformationObject).reduce((reversed, [key, value]) => {
        const simple = value.match(/(^\$(\."(\w|-)+")+$)|(^(\w|\.)*$)/g) && !(value === "true" || value === "false" || !Number.isNaN(Number.parseFloat(value)));
        if (!simple) return reversed;

        //Deconstruct escaped keys
        if (value.startsWith('$')) {
            value = value.split('.').slice(1).map(v => v.slice(1, -1)).join('.')
        }
        //The mapping is only relevant if both that key and the value side of the mapping refer to an API inside the prefixes
        const relevant = prefixes.some(p => key.startsWith(p)) && prefixes.some(p => value.startsWith(p));
        //A mapping is only simple, if it containes no logic at all so it simply maps one key to another one
        //We only revert mapping entries that are simpel and relevant
        if (!relevant) return reversed;

        return {
            ...reversed,
            [value]: buildJSONataKey(key.split('.')),
        }

    }, {});

    return JSON.stringify(unflatten(reversedMapping));
}