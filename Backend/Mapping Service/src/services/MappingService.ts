import { logger } from "../Service";
import { Mapping, OpenApiMapping, AsyncApiMapping, IMapping, MappingType, MappingDirection } from "../models/MappingModel";
import { MongoError } from "mongodb";
import { ElementAlreadyExistsError } from "../utils/errors/ElementAlreadyExistsError";
import * as ReverseMappingService from "./ReverseService";
import { NoSuchElementError } from "../utils/errors/NoSuchElementError";
import { ApiType } from "../models/ApiModel";
import { Document } from "../utils/interfaces/Document";

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
        logger.info(`Mapping created successfully!`);

        const reverseMappings = ReverseMappingService.reverseMapping(mappingData);
        const reverseMappingPromises = reverseMappings.map(m => TypedMapping.create(m as any)) as Promise<any>[];
        await Promise.all(reverseMappingPromises);

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

export async function getMappings(conditions: { type?: MappingType, apiType?: ApiType, direction?: MappingDirection } = {}): Promise<Array<IMapping & Document>> {
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
        const mapping = await Mapping.findByIdAndUpdate(mappingData.id, mappingData);
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
