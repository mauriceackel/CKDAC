import { IAsyncApiMapping, IMapping, IMappingPair, MappingDirection, MappingType } from "../../models/MappingModel";
import * as MappingService from "../MappingService";
import { IAsyncApiOperation } from "../../models/OperationModel";
import { ApiType } from "../../models/ApiModel";
import { flatten, unflatten } from "flat";
import { operatorsRegex } from "../../utils/jsonata-helpers";
import { getSourceMessageBody, getTargetMessageBodies } from "../../utils/body-helpers";
import { Tree, treeSearch } from "../../utils/tree-search";
import { transToMappingPairs } from "../../utils/jsonata-to-mapping-pairs";
import { Document } from "mongoose";
const getinputs = require('../../utils/get-inputs/get-inputs');

type ParsedAsyncApiMapping = Omit<IAsyncApiMapping, "messageMappings"> & { messageMappings: { [targetId: string]: { [key: string]: string } }, messageMappingsInputKeys: { [targetId: string]: { [key: string]: string[] } } }


export async function generateMapping(source: IAsyncApiOperation, targets: { [key: string]: IAsyncApiOperation }, direction: MappingDirection): Promise<IMappingPair[]> {
    const sourceId = `${source.api.id}_${source.operationId}`;
    const targetIds = Object.keys(targets);

    const [requiredSourceKeys, requiredTargetKeys] = await Promise.all([
        getSourceMessageBody(source).then(b => flatten(b)).then(f => Object.keys(f)),
        getTargetMessageBodies(targets).then(b => flatten(b)).then(f => Object.keys(f))
    ]);

    let messageMappings: { [targetId: string]: { [key: string]: string } } = {};

    //For each of the target APIs, create trees that start at the source API and end at the specific target API.
    //Finally, flat-map all those trees into one array
    for (let i = 0; i < targetIds.length; i++) {
        const mappingTrees = await treeSearch(ApiType.ASYNC_API, sourceId, targetIds[i], direction);

        let subresult: { [key: string]: string } = {}
        if (direction === MappingDirection.INPUT) {
            for (let j = 0; j < mappingTrees.length; j++) {
                const { messageMappings: msgMap, break: breakLoop } = executeMappingTreeInputDirection(mappingTrees[j], sourceId, targetIds, requiredSourceKeys);
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
                const { messageMapping: msgMap, break: breakLoop } = executeMappingTreeOutputDirection(mappingTrees[j], sourceId, targetIds, targetIds[i], requiredTargetKeys);
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

    const mappingPairs: Array<IMappingPair> = [];
    for (const targetId in messageMappings) {
      const singleMapping: Record<string, any> = unflatten(messageMappings[targetId]);
      const pairs = transToMappingPairs(singleMapping);
      mappingPairs.push(...pairs);
    }

    return mappingPairs;
}

function parseAsyncApiMapping(m: IMapping & Document, sourceId: string, targetIds: string[]): ParsedAsyncApiMapping {
    const mapping = m.toObject() as IAsyncApiMapping;

    const mappingComesFromSource = mapping.sourceId === sourceId;
    const mappingPointsToTarget = targetIds.some(tId => mapping.targetIds.includes(tId));

    // If mapping points directly from source to target, include static values
    const includeStatic = mappingComesFromSource && mappingPointsToTarget;

    const messageMappings: { [targetId: string]: { [key: string]: string } } = {};
    const messageMappingsInputKeys: { [targetId: string]: { [key: string]: string[] } } = {};
    for (const targetId in mapping.messageMappings) {
        const flattened = flatten(JSON.parse(mapping.messageMappings[targetId])) as { [key: string]: string };
        messageMappings[targetId] = {};
        messageMappingsInputKeys[targetId] = {};

        for (const key in flattened) {
            const value = flattened[key];
            const inputs = getinputs(`{"${key}": ${value}}`).getInputs({}) as string[];

            if (inputs.length === 0 && !includeStatic) {
                // ignore mappings with static values
                continue;
            }

            messageMappings[targetId][key] = operatorsRegex.test(value) ? `(${value})` : value;
            messageMappingsInputKeys[targetId][key] = inputs;
        }
    }

    const parsedMapping: ParsedAsyncApiMapping = {
        ...mapping,
        messageMappings,
        messageMappingsInputKeys
    };

    return parsedMapping
}

function executeMappingTreeInputDirection(mappingTree: Tree<IMapping & Document>, sourceId: string, targetIds: string[], requiredKeys: string[]): { messageMappings: { [targetId: string]: { [key: string]: string } }, break?: boolean } {
    const { node, children } = mappingTree;

    const parsedMapping = parseAsyncApiMapping(node, sourceId, targetIds);

    if (children === undefined) {
        return { messageMappings: parsedMapping.messageMappings };
    }

    const messageMappings: { [targetId: string]: { [key: string]: string } } = {};

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const result = executeMappingTreeInputDirection(child, sourceId, targetIds, requiredKeys);
        if (result.break) {
            return result;
        }
        const msgMappings = performInputMessageMapping(result.messageMappings, parsedMapping.messageMappings[child.node.sourceId], parsedMapping.messageMappingsInputKeys[child.node.sourceId]);
        for (const targetId in msgMappings) {
            messageMappings[targetId] = { ...(messageMappings[targetId] || {}), ...msgMappings[targetId] };
        }
    }

    const providedMappingKeys = Object.values(messageMappings).map(m => Object.keys(m));
    //For all provided keys of all mappings
    const messageMappingValid = providedMappingKeys.every(providedKeys => requiredKeys.every(key => providedKeys.includes(key)))

    return { messageMappings, break: messageMappingValid };
}

function executeMappingTreeOutputDirection(mappingTree: Tree<IMapping & Document>, sourceId: string, targetIds: string[], finalTargetId: string, requiredKeys: string[]): { messageMapping: { [key: string]: string }, break?: boolean } {
    const { node, children } = mappingTree;

    const parsedMapping = parseAsyncApiMapping(node, sourceId, targetIds);

    if (children === undefined) {
        return { messageMapping: parsedMapping.messageMappings[finalTargetId] };
    }

    let messageMapping: { [key: string]: string } = {};

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const result = executeMappingTreeOutputDirection(child, sourceId, targetIds, finalTargetId, requiredKeys);
        if (result.break) {
            return result;
        }
        const msgMappings = performOutputMessageMapping(parsedMapping.messageMappings[child.node.sourceId], result.messageMapping);
        messageMapping = { ...messageMapping, ...msgMappings };
    }

    const providedMappingKeys = Object.keys(messageMapping);
    const messageMappingValid = requiredKeys.every(key => providedMappingKeys.includes(key))

    return { messageMapping, break: messageMappingValid };
}

function performInputMessageMapping(input: { [targetId: string]: { [key: string]: string } }, mapping: { [key: string]: string }, mappingInputKeys: { [key: string]: string[] }) {
    const targetIds = Object.keys(input);
    const result: { [targetId: string]: { [key: string]: string } } = {};

    for (let i = 0; i < targetIds.length; i++) {
        const targetId = targetIds[i];
        const inputKeys = Object.keys(input[targetId]);
        const simpleRegex = new RegExp(inputKeys.map((k) => `^${k}$`).join('|'), 'g');
        const extendedInputKeys = inputKeys.map(k => `\\$\\.${k.split('.').map(p => `"${p}"`).join('\\.')}`);
        const extendedRegex = new RegExp(extendedInputKeys.join('|'), 'g');

        const subresult: { [key: string]: string } = {};

        //For each entry in the mapping, try to replace a key from the input with a value from the input
        for (const key in mapping) {
            //If a mapping entry requires value from a source other the the current input source API, skip it
            if (!mappingInputKeys[key].every(k => inputKeys.includes(k))) {
                continue;
            }
           
            subresult[key] = mapping[key].replace(extendedRegex, (match) => {
                const resultingKey = match.split('.').slice(1).map(v => v.slice(1, -1)).join('.')
                return input[targetId][resultingKey];
            });
            subresult[key] = subresult[key].replace(simpleRegex, (match) => input[targetId][match]);
        }

        result[targetId] = subresult;
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
function performOutputMessageMapping(input: { [key: string]: string }, mapping: { [key: string]: string }) {
    const inputKeys = Object.keys(input);
    const simpleRegex = new RegExp(inputKeys.map((k) => `^${k}$`).join('|'), 'g');
    const extendedInputKeys = inputKeys.map(k => `\\$\\.${k.split('.').map(p => `"${p}"`).join('\\.')}`);
    const extendedRegex = new RegExp(extendedInputKeys.join('|'), 'g');

    const result: { [key: string]: string } = {};

    //For each entry in the mapping, try to replace a key from the input with a value from the input
    for (const key in mapping) {     
        result[key] = mapping[key].replace(extendedRegex, (match) => {
            const resultingKey = match.split('.').slice(1).map(v => v.slice(1, -1)).join('.')
            return input[resultingKey];
        });
        result[key] = result[key].replace(simpleRegex, (match) => input[match]);
    }

    return result;
}