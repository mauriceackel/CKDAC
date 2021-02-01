import { IAsyncApiMapping, IMapping, MappingDirection, MappingType } from "../../models/MappingModel";
import * as MappingService from "../MappingService";
import { IAsyncApiOperation } from "../../models/OperationModel";
import { ApiType } from "../../models/ApiModel";
import { flatten, unflatten } from "flat";
import { operatorsRegex } from "../../utils/jsonata-helpers";
import { getSourceMessageBody, getTargetMessageBodies } from "../../utils/body-helpers";
import { Tree, treeSearch } from "../../utils/tree-search";
const getinputs = require('../../utils/get-inputs/get-inputs');

type ParsedAsyncApiMapping = Omit<IAsyncApiMapping, "messageMappings"> & { messageMappings: { [targetId: string]: { [key: string]: string } }, messageMappingsInputKeys: { [targetId: string]: { [key: string]: string[] } } }
type AsyncApiTree = Tree<ParsedAsyncApiMapping>;


export async function generateMapping(source: IAsyncApiOperation, targets: { [key: string]: IAsyncApiOperation }, direction: MappingDirection): Promise<IAsyncApiMapping> {
    const sourceId = `${source.api.id}_${source.operationId}`;
    const targetIds = Object.keys(targets);

    const mappings: { [key: string]: ParsedAsyncApiMapping[] } = (await MappingService.getMappings({ apiType: ApiType.ASYNC_API, direction })).reduce((obj, m) => {
        const mapping = m.toObject() as IAsyncApiMapping;

        const messageMappings: { [targetId: string]: { [key: string]: string } } = {};
        const messageMappingsInputKeys: { [targetId: string]: { [key: string]: string[] } } = {};
        for (const targetId in mapping.messageMappings) {
            const flattened = flatten(JSON.parse(mapping.messageMappings[targetId])) as { [key: string]: string };
            messageMappings[targetId] = {};
            messageMappingsInputKeys[targetId] = {};

            for (const key in flattened) {
                const value = flattened[key];
                messageMappings[targetId][key] = operatorsRegex.test(value) ? `(${value})` : value;
                messageMappingsInputKeys[targetId][key] = getinputs(`{"${key}": ${value}}`).getInputs({}) as string[];
            }
        }

        const parsedMapping: ParsedAsyncApiMapping = {
            ...mapping,
            messageMappings,
            messageMappingsInputKeys
        };

        return {
            ...obj,
            [parsedMapping.sourceId]: [...(obj[parsedMapping.sourceId] || []), parsedMapping]
        }
    }, {} as { [key: string]: ParsedAsyncApiMapping[] });

    const [requiredSourceKeys, requiredTargetKeys] = await Promise.all([
        getSourceMessageBody(source).then(b => flatten(b)).then(f => Object.keys(f)),
        getTargetMessageBodies(targets).then(b => flatten(b)).then(f => Object.keys(f))
    ]);

    let messageMappings: { [targetId: string]: { [key: string]: string } } = {};

    //For each of the target APIs, create trees that start at the source API and end at the specific target API.
    //Finally, flat-map all those trees into one array
    for (let i = 0; i < targetIds.length; i++) {
        const mappingTrees = treeSearch(sourceId, targetIds[i], mappings) as AsyncApiTree[];

        let subresult: { [key: string]: string } = {}
        if (direction === MappingDirection.INPUT) {
            for (let j = 0; j < mappingTrees.length; j++) {
                const { messageMappings: msgMap, break: breakLoop } = executeMappingTreeSubscribe(mappingTrees[j], requiredSourceKeys);
                subresult = { ...subresult, ...msgMap[targetIds[i]] };
                if (breakLoop) break;
            }

            //Clean mapping
            for (const key in subresult) {
                if (key.indexOf(sourceId) !== 0) {
                    delete subresult[key];
                }
            }
        } else if (direction === MappingDirection.OUTPUT) {
            for (let j = 0; j < mappingTrees.length; j++) {
                const { messageMapping: msgMap, break: breakLoop } = executeMappingTreePublish(mappingTrees[j], targetIds[i], requiredTargetKeys);
                subresult = { ...subresult, ...msgMap };
                if (breakLoop) break;
            }

            //Clean mapping
            for (const key in subresult) {
                if (!targetIds.some(tId => key.indexOf(tId) === 0)) {
                    delete subresult[key];
                }
            }
        }

        messageMappings = { ...messageMappings, [targetIds[i]]: subresult };
    }

    for (const targetId in messageMappings) {
        messageMappings[targetId] = unflatten(messageMappings[targetId]);
    }

    return {
        id: 'automatically-generated',
        apiType: ApiType.ASYNC_API,
        createdBy: 'automatically-generated',
        sourceId: `${source.api.id}_${source.operationId}`,
        targetIds: Object.keys(targets),
        type: MappingType.AUTO,
        direction,
        topics: {
            source: '',
            targets: {}
        },
        servers: {
            source: '',
            targets: {}
        },
        messageMappings: Object.entries(messageMappings).reduce((obj, [key, value]) => ({ ...obj, [key]: JSON.stringify(value) }), {} as { [targetId: string]: string }),
    };
}

function executeMappingTreeSubscribe(mappingTree: AsyncApiTree, requiredKeys: string[]): { messageMappings: { [targetId: string]: { [key: string]: string } }, break?: boolean } {
    const { node, children } = mappingTree;

    if (children === undefined) {
        return { messageMappings: node.messageMappings };
    }

    const messageMappings: { [targetId: string]: { [key: string]: string } } = {};

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const result = executeMappingTreeSubscribe(child, requiredKeys);
        if (result.break) {
            return result;
        }
        const msgMappings = performMessageMapping(result.messageMappings, node.messageMappings[child.node.sourceId]);
        for (const targetId in msgMappings) {
            messageMappings[targetId] = { ...(messageMappings[targetId] || {}), ...msgMappings[targetId] };
        }
    }

    const providedMappingKeys = Object.values(messageMappings).map(m => Object.keys(m));
    //For all provided keys of all mappings
    const messageMappingValid = providedMappingKeys.every(providedKeys => requiredKeys.every(key => providedKeys.includes(key)))

    return { messageMappings, break: messageMappingValid };
}

function executeMappingTreePublish(mappingTree: AsyncApiTree, finalTargetId: string, requiredKeys: string[]): { messageMapping: { [key: string]: string }, break?: boolean } {
    const { node, children } = mappingTree;

    if (children === undefined) {
        return { messageMapping: node.messageMappings[finalTargetId] };
    }

    let messageMapping: { [key: string]: string } = {};

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const result = executeMappingTreePublish(child, finalTargetId, requiredKeys);
        if (result.break) {
            return result;
        }
        const msgMappings = performRequestMapping(node.messageMappings[child.node.sourceId], result.messageMapping);
        messageMapping = { ...messageMapping, ...msgMappings };
    }

    const providedMappingKeys = Object.keys(messageMapping);
    const messageMappingValid = requiredKeys.every(key => providedMappingKeys.includes(key))

    return { messageMapping, break: messageMappingValid };
}

function performMessageMapping(input: { [targetId: string]: { [key: string]: string } }, mapping: { [key: string]: string }) {
    const targetIds = Object.keys(input);
    const result: { [targetId: string]: { [key: string]: string } } = {};

    for (let i = 0; i < targetIds.length; i++) {
        const inputKeys = Object.keys(input[targetIds[i]]);
        const simpleRegex = new RegExp(inputKeys.join('|'), 'g');
        const extendedInputKeys = inputKeys.map(k => `\\$\\.${k.split('.').map(p => `"${p}"`).join('\\.')}`);
        const extendedRegex = new RegExp(extendedInputKeys.join('|'), 'g');

        const subresult: { [key: string]: string } = {};

        //For each entry in the mapping, try to replace a key from the input with a value from the input
        for (const key in mapping) {
            subresult[key] = mapping[key].replace(simpleRegex, (match) => input[targetIds[i]][match]);
            subresult[key] = subresult[key].replace(extendedRegex, (match) => {
                const resultingKey = match.split('.').slice(1).map(v => v.slice(1, -1)).join('.')
                return input[targetIds[i]][resultingKey];
            });
        }

        result[targetIds[i]] = subresult;
    }

    return result;
}

/**
 * Marges two mappings into one (i.e. A -> B and B -> C become A -> C).
 *
 * Gets all keys from the input (i.e. some mapping). No filtering applied.
 * Afterwards, loops through all key of the mapping that should be altered. If a value includes any key from the input, this key is replaced by the value from the input.
 *
 * @param input The mapping from B -> C
 * @param mapping The Mapping from A -> B
 * @param sourceId The ID of the source API, required for filtering
 * @param targetIds The IDs of all target APIs, required for filtering
 *
 * @returns A combined mapping from "mapping.source" to "input.target"
 */
function performRequestMapping(input: { [key: string]: string }, mapping: { [key: string]: string }) {
    const inputKeys = Object.keys(input);
    const simpleRegex = new RegExp(inputKeys.join('|'), 'g');
    const extendedInputKeys = inputKeys.map(k => `\\$\\.${k.split('.').map(p => `"${p}"`).join('\\.')}`);
    const extendedRegex = new RegExp(extendedInputKeys.join('|'), 'g');

    const result: { [key: string]: string } = {};

    //For each entry in the mapping, try to replace a key from the input with a value from the input
    for (const key in mapping) {
        result[key] = result[key].replace(extendedRegex, (match) => {
            const resultingKey = match.split('.').slice(1).map(v => v.slice(1, -1)).join('.')
            return input[resultingKey];
        });
        result[key] = mapping[key].replace(simpleRegex, (match) => input[match]);
    }

    return result;
}