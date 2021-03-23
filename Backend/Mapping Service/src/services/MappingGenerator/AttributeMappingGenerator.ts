import flatten from "flat";
import { AttributeNode, IAttributeEdge, IAttributeNode, IMappingPair, MappingDirection, MappingPairType } from "../../models/MappingModel";
import { IAsyncApiOperation, IOpenApiOperation } from "../../models/OperationModel";
import { getMessageSchema } from "../../utils/asyncapi-parser";
import { getRequestSchema, getResponseSchema } from "../../utils/swagger-parser";
import { isValid } from "../MappingService";
import { revertEdge } from "../ReverseService";

export async function generateMappingForOpenApi(source: IOpenApiOperation, targets: { [key: string]: IOpenApiOperation }, mappingPairs?: IMappingPair[]): Promise<{ request: IMappingPair[], response: IMappingPair[] }> {
    // Request direction (i.e. target = required)
    const sourceRequestBody = {
        [`${source.api.id}_${source.operationId}_${source.responseId}`]: await getRequestSchema(source)
    }
    const targetRequestBodies = await Promise.all(
        Object.entries(targets).map(async ([key, target]) => ({ 
            key,
            schema: await getRequestSchema(target)
        }))
    ).then((schemas) => schemas.reduce((obj, { key, schema }) => ({
         ...obj,
         [key]: schema
    }), {} as Record<string, any>));

    // TODO: Filter already mapped
    const requiredRequestKeys = Object.keys(flatten(targetRequestBodies));
    const providedRequestKeys = Object.keys(flatten(sourceRequestBody));

    const requestMappingPairPromises: Promise<IMappingPair | undefined>[] = [];
    for(const requiredKey of requiredRequestKeys) {
        for(const providedKey of providedRequestKeys) {
            requestMappingPairPromises.push(generateSingleMapping(providedKey, requiredKey))
        }
    }
    const requestMappingPairs = (await Promise.all(requestMappingPairPromises)).filter((mp): mp is IMappingPair => mp !== undefined);
    
    // Response direction (i.e. source = required)
    const sourceResponseBody = {
        [`${source.api.id}_${source.operationId}_${source.responseId}`]: await getResponseSchema(source)
    }
    const targetResponseBodies = await Promise.all(
        Object.entries(targets).map(async ([key, target]) => ({ 
            key,
            schema: await getResponseSchema(target)
        }))
    ).then((schemas) => schemas.reduce((obj, { key, schema }) => ({
         ...obj,
         [key]: schema
    }), {} as Record<string, any>));
    
    const localKnowledgeGraph = mappingPairs ? buildLocalKnowledgeGraph(mappingPairs) : undefined;

    // TODO: Filter already mapped
    const requiredResponseKeys = Object.keys(flatten(sourceResponseBody));
    const providedResponseKeys = Object.keys(flatten(targetResponseBodies));

    const responseMappingPairPromises: Promise<IMappingPair | undefined>[] = [];
    for(const requiredKey of requiredResponseKeys) {
        for(const providedKey of providedResponseKeys) {
            responseMappingPairPromises.push(generateSingleMapping(providedKey, requiredKey, localKnowledgeGraph))
        }
    }
    const responseMappingPairs = (await Promise.all(responseMappingPairPromises)).filter((mp): mp is IMappingPair => mp !== undefined);

    return {
        request: requestMappingPairs,
        response: responseMappingPairs,
    }
}

export async function generateMappingForAsyncApi(source: IAsyncApiOperation, targets: { [key: string]: IAsyncApiOperation }, direction: MappingDirection, mappingPairs?: IMappingPair[]) {
    let providedSchema: Record<string, any>;
    let requiredSchema: Record<string, any>;

    switch(direction) {
        case MappingDirection.OUTPUT: {
            // Target is required, Source is provided
            providedSchema = {
                [`${source.api.id}_${source.operationId}`]: await getMessageSchema(source)
            }
            requiredSchema = await Promise.all(
                Object.entries(targets).map(async ([key, target]) => ({ 
                    key,
                    schema: await getMessageSchema(target)
                }))
            ).then((schemas) => schemas.reduce((obj, { key, schema }) => ({
                ...obj,
                [key]: schema
            }), {} as Record<string, any>));
        }; break;
        case MappingDirection.INPUT: {
            // Target is provided, Source is required
            requiredSchema = {
                [`${source.api.id}_${source.operationId}`]: await getMessageSchema(source)
            }
            providedSchema = await Promise.all(
                Object.entries(targets).map(async ([key, target]) => ({ 
                    key,
                    schema: await getMessageSchema(target)
                }))
            ).then((schemas) => schemas.reduce((obj, { key, schema }) => ({
                ...obj,
                [key]: schema
            }), {} as Record<string, any>));
        }
    }

    const localKnowledgeGraph = mappingPairs ? buildLocalKnowledgeGraph(mappingPairs) : undefined;

    // TODO: Filter already mapped
    const requiredResponseKeys = Object.keys(flatten(requiredSchema));
    const providedResponseKeys = Object.keys(flatten(providedSchema));

    const mappingPairPromises: Promise<IMappingPair | undefined>[] = [];
    for(const requiredKey of requiredResponseKeys) {
        for(const providedKey of providedResponseKeys) {
            mappingPairPromises.push(generateSingleMapping(providedKey, requiredKey, localKnowledgeGraph))
        }
    }
    const result = (await Promise.all(mappingPairPromises)).filter((mp): mp is IMappingPair => mp !== undefined);

    return result;
}

export async function generateSingleMapping(providedAttributeId: string, requiredAttributeId: string, knowledgeGraph?: Map<string, IAttributeNode>): Promise<IMappingPair | undefined> {
    const attribute = await AttributeNode.findOne({ attributeId: providedAttributeId });
    const localAttribute = knowledgeGraph?.get(providedAttributeId);

    // No attribute mapping exists
    if(!attribute && !localAttribute) {
        return undefined;
    }

    // Attribute mapping exists but there is no way to get to provided attribute
    const combinedComponent = [...(attribute?.component || []), ...(localAttribute?.component || [])];
    if(!combinedComponent.includes(requiredAttributeId)) {
        return undefined;
    }

    const mappingChain = await shortestPath(providedAttributeId, requiredAttributeId, knowledgeGraph);

    const mappingPair: IMappingPair = {
        creationType: MappingPairType.ATTRIBUTE,
        requiredAttributeId: requiredAttributeId,
        providedAttributeIds: [providedAttributeId],
        mappingTransformation: performTransformations(mappingChain)
    };

    return mappingPair;
}

async function shortestPath(sourceId: string, targetId: string, knowledgeGraph?: Map<string, IAttributeNode>): Promise<IAttributeEdge[]> {
    if (sourceId === targetId) return [{ source: sourceId, target: targetId, transformation: targetId }];

    const initialEdge: IAttributeEdge = { source: 'dummy', target: sourceId, transformation: '' };
    const paths = [[initialEdge]];
    const visited = [];

    while (paths.length > 0) {
      const path = paths.shift()!;
      const lastEdge = path[path.length - 1];

      visited.push(lastEdge.target);

      const node = await AttributeNode.findOne({ attributeId: lastEdge.target });
      const localNode = knowledgeGraph?.get(lastEdge.target);

      const edges = [...(node?.edges || []), ...(localNode?.edges || [])];
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];

        if (edge.target === targetId) return [...path.slice(1), edge];

        if (visited.includes(edge.target)) continue;

        paths.push([...path, edge]);
      }
    }

    return [];
}

function performTransformations(edges: IAttributeEdge[]): string {
    // The edges point from source to target, so we have to start replacing at the end
    const [finalEdge] = edges.slice(-1);
    const otherEdges = edges.slice(0, -1);
    if(finalEdge === undefined) return "";

    const joined = otherEdges.reduceRight((trans, e) => {
        const simpleRegex = new RegExp(`${e.target}(?=$|[\\W])`, 'g');
        const complexRegex = new RegExp(`\\$\\.${e.target.split('.').map(p => `"${p}"`).join('\\.')}`, 'g');
        
        let result = trans.replace(complexRegex, `(${e.transformation})`);
        result = result.replace(simpleRegex, `(${e.transformation})`);

        return result
    }, finalEdge.transformation);
    return joined;
}

export function buildLocalKnowledgeGraph(mappingPairs: IMappingPair[]) {
    const knowledgeGraph = new Map<string, IAttributeNode>();
    
    for(const mappingPair of mappingPairs) {
        if(!isValid(mappingPair)) {
            continue;
        }

        addLocalAttributeNode(knowledgeGraph, mappingPair.providedAttributeIds[0], mappingPair.requiredAttributeId, mappingPair.mappingTransformation)
    }

    return knowledgeGraph;
}

function addLocalAttributeNode(knowledgeGraph: Map<string, IAttributeNode>, sourceId: string, targetId: string, transformation: string) {
    const [sourceNode, targetNode] = [
        knowledgeGraph.get(sourceId),
        knowledgeGraph.get(targetId),
    ];
  
    // Add edges
    const forwardEdge: IAttributeEdge = {
        source: sourceId,
        target: targetId,
        transformation: transformation
    };
    const backwardEdge = revertEdge(forwardEdge);

    // Build new component with all unique attribute ids. This always includes source and target id
    const joinedComponentSet = new Set<string>([sourceId, targetId]);
    sourceNode?.component.forEach((c) => joinedComponentSet.add(c));
    targetNode?.component.forEach((c) => joinedComponentSet.add(c));
    const joinedComponent = [...joinedComponentSet];
    
    if (sourceNode?.component.includes(targetId)) {
        console.log("Already exists");
        return;
    }

    // Upsert source node
    knowledgeGraph.set(sourceId, {
        attributeId: sourceId,
        edges: [...(sourceNode?.edges || []), forwardEdge],
        component: joinedComponent
    });

    // Upsert target node
    knowledgeGraph.set(targetId, {
        attributeId: targetId,
        edges: [...(targetNode?.edges || []), backwardEdge],
        component: joinedComponent
    });


    // Update all nodes in the combined component with the new component
    for(const attributeId of joinedComponent) {
        const node = knowledgeGraph.get(attributeId);
        
        if(!node) {
            continue;
        }

        knowledgeGraph.set(attributeId, {
            attributeId: node.attributeId,
            edges: node.edges,
            component: joinedComponent
        });
    }
}