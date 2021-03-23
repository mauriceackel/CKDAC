import { logger } from "../Service";
import { Mapping, OpenApiMapping, AsyncApiMapping, IMapping, MappingType, MappingDirection, IMappingPair, IAsyncApiMapping, IOpenApiMapping, AttributeNode, IAttributeEdge } from "../models/MappingModel";
import { MongoError } from "mongodb";
import { ElementAlreadyExistsError } from "../utils/errors/ElementAlreadyExistsError";
import * as ReverseMappingService from "./ReverseService";
import { NoSuchElementError } from "../utils/errors/NoSuchElementError";
import { ApiType } from "../models/ApiModel";
import { Document } from "../utils/interfaces/Document";
import { transToMappingPairs } from "../utils/jsonata-to-mapping-pairs";
import jsonata from 'jsonata';
import { isSimple, revertEdge } from "./ReverseService";
import { IOperation } from "../models/OperationModel";

export async function createMapping(mappingData: IMapping): Promise<IMapping & Document> {
    logger.info(`Trying to create new mapping with data: `, mappingData);

    try {
        let TypedMapping: typeof OpenApiMapping | typeof AsyncApiMapping;
        switch (mappingData.apiType) {
            case ApiType.OPEN_API: TypedMapping = OpenApiMapping; break;
            case ApiType.ASYNC_API: TypedMapping = AsyncApiMapping; break;
            default: throw new Error("Unknown api type");
        }

        const mapping = await TypedMapping.create(mappingData);
        
        const reverseMappings = ReverseMappingService.reverseMapping(mappingData);
        const reverseMappingPromises = reverseMappings.map(m => TypedMapping.create(m as any)) as Promise<any>[];
        await Promise.all(reverseMappingPromises);

        // Create attribute mapping nodes
        await createAttributeNodesFromMapping(mappingData);
        
        logger.info(`Mapping created successfully!`);
        
        return mapping;
    } catch (err) {
        logger.error("Error while creating new mapping: ", err);
        if (err instanceof MongoError) {
            if ((err as MongoError).code == 11000) {
                throw new ElementAlreadyExistsError();
            }
        }
        throw err;
    }
}

export async function getMapping(mappingId: string): Promise<IMapping & Document> {
    logger.info(`Trying to retrieve mapping with id ${mappingId}`);

    try {
        const mapping = await Mapping.findById(mappingId);
        if (mapping !== null) {
            return mapping;
        } else {
            throw new NoSuchElementError(`No mapping with id "${mappingId}" was found in the database.`);
        }
    } catch (err) {
        logger.error(`Error while retrieving mapping with id ${mappingId} from database: `, err);
        throw err;
    }
}

export async function getMappings(conditions: { type?: MappingType, apiType?: ApiType, direction?: MappingDirection, createdBy?: string } = {}): Promise<Array<IMapping & Document>> {
    logger.info(`Trying to retrieve all mappings with conditions ${JSON.stringify(conditions)}`);

    try {
        const mappings = await Mapping.find(conditions);
        return mappings || [];
    } catch (err) {
        logger.error(`Error while retrieving all mappings with conditions ${JSON.stringify(conditions)} from database: `, err);
        throw err;
    }
}

export async function updateMapping(mappingData: IMapping) {
    logger.info(`Trying to update mapping with id ${mappingData.id}`);

    try {
        let mapping = null;
        switch(mappingData.apiType) {
            case ApiType.ASYNC_API: {
                mapping = await AsyncApiMapping.findByIdAndUpdate(mappingData.id, { $set: mappingData });
            }; break;
            case ApiType.OPEN_API: {
                mapping = await OpenApiMapping.findByIdAndUpdate(mappingData.id, { $set: mappingData });
            }; break;
        }
        if (mapping !== null) {
            logger.info(`Mapping "${mappingData.id}" was updated successfully.`);
        } else {
            throw new NoSuchElementError(`Mapping with id "${mappingData.id}" was not found in the database.`);
        }
    } catch (err) {
        logger.error(`Error while updating mapping with id ${mappingData.id}: `, err);
        throw err;
    }
}

export async function deleteMapping(mappingId: string) {
    logger.info(`Trying to delete mapping with id ${mappingId}`);

    try {
        const mapping = await Mapping.findByIdAndDelete(mappingId);
        if (mapping !== null) {
            logger.info(`Mapping "${mappingId}" was deleted successfully.`);
        } else {
            throw new NoSuchElementError(`Mapping with id "${mappingId}" was not deleted because it does not exist.`);
        }
    } catch (err) {
        logger.error(`Error while deleting mapping with id ${mappingId}: `, err);
        throw err;
    }
}

function createAttributeNodesFromMapping(mapping: IMapping) {
    let mappingPairs: IMappingPair[];
    switch(mapping.apiType) {
        case ApiType.ASYNC_API: {
            mappingPairs = transToMappingPairs((mapping as IAsyncApiMapping).messageMappings)
        };
        case ApiType.OPEN_API: {
            const requestMappingPairs = transToMappingPairs(JSON.parse((mapping as IOpenApiMapping).requestMapping));
            const responseMappingPairs = transToMappingPairs(JSON.parse((mapping as IOpenApiMapping).responseMapping));
            mappingPairs = requestMappingPairs.concat(responseMappingPairs);
        }
    }

    const validMappingPairs = mappingPairs.filter(isValid);
    
    const promises = validMappingPairs.map((mappingPair) => 
        createAttributeNode(mappingPair.providedAttributeIds[0], mappingPair.requiredAttributeId, mappingPair.mappingTransformation)
    );
    return Promise.all(promises);
}

// Tests if a mapping pair is valid for an attribute mapping
export function isValid(mappingPair: IMappingPair): boolean {
    if (mappingPair.providedAttributeIds.length !== 1) {
        return false;
    }
    
    return isSimple(jsonata(mappingPair.mappingTransformation).ast())[0];
}

async function createAttributeNode(sourceId: string, targetId: string, transformation: string) {
    const [sourceNode, targetNode] = await Promise.all([
        AttributeNode.findOne({ attributeId: sourceId }),
        AttributeNode.findOne({ attributeId: targetId }),
    ]);
  
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
    if (sourceNode) {
        await sourceNode.update({
            edges: [...sourceNode.edges, forwardEdge],
            component: joinedComponent
        })
    } else {
        await AttributeNode.create({
            attributeId: sourceId,
            edges: [forwardEdge],
            component: joinedComponent
        })
    }

    // Upsert target node
    if (targetNode) {
        await targetNode.update({
            edges: [...targetNode.edges, backwardEdge],
            component: joinedComponent
        })
    } else {
        await AttributeNode.create({
            attributeId: targetId,
            edges: [backwardEdge],
            component: joinedComponent
        })
    }

    // Update all nodes in the combined component with the new component
    await Promise.all(joinedComponent.map((attributeId) => {
        return AttributeNode.updateOne({ attributeId }, {
            component: joinedComponent
        });
    }))
}

export async function getMappedOperations(apiType: ApiType, sourceId: string, targetApiId: string, visitedApis: string[] = []) {
    const sources = await Mapping.find({ apiType, sourceId });
    
    const mappedOperations: { apiId: string, operationId: string }[] = [];
    //This double loop makes it so that each 1:n mapping is treated somewhat like a 1:1 mapping
    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        for (let j = 0; j < source.targetIds.length; j++) {
            const targetId = source.targetIds[j];
            const [apiId, operationId] = targetId.split('_');

            if (targetApiId === apiId) {
                //If one target ID matches our final target API, we add the mapping without any children to the tree
                mappedOperations.push({ apiId, operationId });
            } else if (!(visitedApis.includes(targetId) || sourceId === targetId)) {
                //If the target ID does not yet match the final target, we execute the recursion step, resulting in a DFS
                const result = await getMappedOperations(apiType, targetId, targetApiId, [...visitedApis, sourceId]);
                mappedOperations.push(...result);
            }
        }
    }
    
    return mappedOperations;
}
