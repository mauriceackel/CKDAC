import { ApiType } from "../../models/ApiModel";
import { flatten, unflatten } from "flat";
import { IOpenApiMapping, MappingType } from "../../models/MappingModel";
import { IOpenApiOperation } from "../../models/OperationModel";
import * as MappingService from "../MappingService";
import { Tree, treeSearch } from "../../utils/tree-search";
import { getSourceResponseBody, getTargetRequestBodies } from "../../utils/body-helpers";
import { operatorsRegex } from "../../utils/jsonata-helpers";
const getinputs = require('../../utils/get-inputs/get-inputs');

type ParsedOpenApiMapping = Omit<IOpenApiMapping, "requestMapping" | "responseMapping"> & { requestMapping: { [key: string]: string }, requestMappingInputKeys: { [key: string]: string[] }, responseMapping: { [key: string]: string }, responseMappingInputKeys: { [key: string]: string[] } }
type OpenApiTree = Tree<ParsedOpenApiMapping>;


export async function generateMapping(source: IOpenApiOperation, targets: { [key: string]: IOpenApiOperation }): Promise<IOpenApiMapping> {
    const sourceId = `${source.api.id}_${source.operationId}_${source.responseId}`;
    const targetIds = Object.keys(targets);

    const mappings: { [key: string]: ParsedOpenApiMapping[] } = (await MappingService.getMappings({ apiType: ApiType.OPEN_API })).reduce((obj, m) => {
        const mapping = m.toObject() as IOpenApiMapping;
        const flatRequestMapping: { [key: string]: string } = flatten(JSON.parse(mapping.requestMapping));

        const requestMapping: { [key: string]: string } = {};
        const requestMappingInputKeys: { [key: string]: string[] } = {};
        for (const key in flatRequestMapping) {
            const value = flatRequestMapping[key];
            requestMapping[key] = operatorsRegex.test(value) ? `(${value})` : value;
            requestMappingInputKeys[key] = getinputs(`{"${key}": ${value}}`).getInputs({}) as string[];
        }

        const flatResponseMapping: { [key: string]: string } = flatten(JSON.parse(mapping.responseMapping));

        const responseMapping: { [key: string]: string } = {};
        const responseMappingInputKeys: { [key: string]: string[] } = {};

        const mappingPointsToTarget = targetIds.some(tId => mapping.targetIds.includes(tId));
        if (mappingPointsToTarget) {
            for (const key in flatResponseMapping) {
                const value = flatResponseMapping[key];
                const inputs = getinputs(`{"${key}": ${value}}`).getInputs({}) as string[];

                responseMappingInputKeys[key] = inputs;

                if (inputs.every(input => targetIds.some(tId => input.indexOf(tId) === 0))) {
                    responseMapping[key] = operatorsRegex.test(value) ? `(${value})` : value;
                }
            }
        } else {
            for (const key in flatResponseMapping) {
                const value = flatResponseMapping[key];
                responseMappingInputKeys[key] = getinputs(`{"${key}": ${value}}`).getInputs({}) as string[];
                responseMapping[key] = operatorsRegex.test(value) ? `(${value})` : value;
            }
        }

        const parsedMapping: ParsedOpenApiMapping = {
            ...mapping,
            requestMapping,
            requestMappingInputKeys,
            responseMapping,
            responseMappingInputKeys
        };

        return {
            ...obj,
            [parsedMapping.sourceId]: [...(obj[parsedMapping.sourceId] || []), parsedMapping]
        }
    }, {} as { [key: string]: ParsedOpenApiMapping[] });

    //For each of the target APIs, create trees that start at the source API and end at the specific target API.
    //Finally, flat-map all those trees into one array
    let mappingTrees: OpenApiTree[] = [];
    for (let i = 0; i < targetIds.length; i++) {
        const result = treeSearch(sourceId, targetIds[i], mappings) as OpenApiTree[];
        mappingTrees = [...mappingTrees, ...result];
    }

    let responseMapping: { [key: string]: string } = {};
    let requestMapping: { [key: string]: string } = {};

    const [requiredSourceKeys, requiredTargetKeys] = await Promise.all([
        getSourceResponseBody(source).then(b => flatten(b)).then(f => Object.keys(f)),
        getTargetRequestBodies(targets).then(b => flatten(b)).then(f => Object.keys(f))
    ]);

    //Now we build the final mappings by executing each identified mapping tree. The results get merged together into one request and response mapping.
    for (let i = 0; i < mappingTrees.length; i++) {
        const { requestMapping: reqMap, responseMapping: resMap, break: breakLoop } = executeMappingTree(mappingTrees[i], requiredSourceKeys, requiredTargetKeys);
        responseMapping = { ...responseMapping, ...resMap };
        requestMapping = { ...requestMapping, ...reqMap };
        if (breakLoop) break;
    }

    //Clean request mapping so that it does not contain any references to APIs other than the targets
    for (const key in requestMapping) {
        if (!targetIds.some(tId => key.indexOf(tId) === 0)) {
            delete requestMapping[key];
        }
    }

    requestMapping = unflatten(requestMapping);
    responseMapping = unflatten(responseMapping);

    return {
        id: 'automatically-generated',
        apiType: ApiType.OPEN_API,
        createdBy: 'automatically-generated',
        sourceId: `${source.api.id}_${source.operationId}_${source.responseId}`,
        targetIds: Object.keys(targets),
        type: MappingType.AUTO,
        requestMapping: JSON.stringify(requestMapping),
        responseMapping: JSON.stringify(responseMapping)
    }
}

/**
  * Builds the final request and response mappings from the identified mapping tree.
  *
  * @param mappingTree The input mapping tree
  * @param sourceId The ID of the source API, required for filtering
  * @param targetIds The IDs of all target APIs, required for filtering
  * @param requestInput The processed request mapping so far (required, as it needs to be passed downards the tree)
  */
function executeMappingTree(mappingTree: OpenApiTree, requiredSourceKeys: string[], requiredTargetKeys: string[], requestInput?: { [key: string]: string }): { responseMapping: { [key: string]: string }, requestMapping: { [key: string]: string }, break?: boolean } {
    const { node, children } = mappingTree;

    //The request mapping that is passed back from the leafs to the root
    let requestMapping = {};
    //The mapping that is created by applying the node's req Mapping on the input
    let newRequestInput: { [key: string]: string } = {};

    if (requestInput === undefined) {
        //If it is the first step and request input is undefined, we set the first request mapping as input
        newRequestInput = node.requestMapping;
    } else {
        //If there is already a request input set, we apply the current mapping on the input
        newRequestInput = performRequestMapping(requestInput, node.requestMapping);
    }

    //The combined input (i.e. mappings) from all children
    if (children === undefined) {
        //Current element is a leaf, so we use the response mapping as an input
        //We don't need to sanitize the response mapping here, because we already remove all mappings that point to 3rd APIs when we parse the mapping
        return { responseMapping: node.responseMapping, requestMapping: newRequestInput };
    }

    let responseInput: { [key: string]: string } = {};
    //Current element is not a leaf, so we continue the recursion
    for (let i = 0; i < children.length; i++) {
        const result = executeMappingTree(children[i], requiredSourceKeys, requiredTargetKeys, newRequestInput);
        if (result.break) {
            return result;
        }
        //Once we get the result, we merge the values for response and request
        responseInput = {
            ...responseInput,
            ...result.responseMapping
        }
        requestMapping = {
            ...requestMapping,
            ...result.requestMapping
        }
    }

    //Finally, we apply the current response mapping the the response input (i.e. the merged inputs from all children)
    const responseMapping = performResponseMapping(responseInput, node.responseMapping, node.responseMappingInputKeys);

    const providedSourceKeys = Object.keys(responseMapping);
    const providedTargetKeys = Object.keys(requestMapping);

    const requestMappingValid = requiredTargetKeys.every(reqKey => providedTargetKeys.includes(reqKey));
    const responseMappingValid = requiredSourceKeys.every(reqKey => providedSourceKeys.includes(reqKey));

    return { responseMapping, requestMapping, break: requestMappingValid && responseMappingValid };
}

/**
 * Marges two mappings into one (i.e. A -> B and B -> C become A -> C).
 *
 * Gets all keys from the input (i.e. some mapping). Filters out key which values include references to an API that is neither source nor target.
 * Filtering is done to prevent having mappings that access keys from APIs other than the source or target(s).
 * Afterwards, loops through all key of the mapping that should be altered. If a value includes any key from the input, this key is replaced by the value from the input.
 *
 * @param input The mapping from B -> C
 * @param mapping The Mapping from A -> B
 * @param sourceId The ID of the source API, required for filtering
 * @param targetIds The IDs of all target APIs, required for filtering
 *
 * @returns A combined mapping from "mapping.source" to "input.target"
 */
function performResponseMapping(input: { [key: string]: string }, mapping: { [key: string]: string }, mappingInputKeys: { [key: string]: string[] }) {
    const inputKeys = Object.keys(input);
    const simpleRegex = new RegExp(inputKeys.join('|'), 'g');
    const extendedInputKeys = inputKeys.map(k => `\\$$\\.${k.split('.').map(p => `"${p}"`).join('\\.')}`);
    const extendedRegex = new RegExp(extendedInputKeys.join('|'), 'g');

    const result: { [key: string]: string } = {};

    //For each entry in the mapping, try to replace a key from the input with a value from the input
    for (const key in mapping) {
        //If a mapping entry requires value from a source other the the current input source API, skip it
        if (!mappingInputKeys[key].every(k => inputKeys.includes(k))) {
            continue;
        }

        result[key] = mapping[key].replace(simpleRegex, (match) => input[match]);
        result[key] = result[key].replace(extendedRegex, (match) => {
            const resultingKey = match.split('.').slice(1).map(v => v.slice(1, -1)).join('.')
            return input[resultingKey];
        });
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
        result[key] = mapping[key].replace(extendedRegex, (match) => {
            const resultingKey = match.split('.').slice(1).map(v => v.slice(1, -1)).join('.')
            return input[resultingKey];
        });
        result[key] = result[key].replace(simpleRegex, (match) => input[match]);
    }

    return result;
}