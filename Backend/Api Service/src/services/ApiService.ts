import { logger } from "../Service";
import { Api, ApiType, IApi } from "../models/ApiModel";
import { MongoError } from "mongodb";
import { ElementAlreadyExistsError } from "../utils/errors/ElementAlreadyExistsError";
import { NoSuchElementError } from "../utils/errors/NoSuchElementError";
import { Document } from "../utils/interfaces/Document";

export async function createApi(apiData: IApi): Promise<IApi & Document> {
    logger.info(`Trying to create new api with data: `, apiData);

    try {
        const api = await Api.create(apiData);
        logger.info(`Api created successfully!`);

        return api;
    } catch (err) {
        logger.error("Error while creating new api: ", err);
        if (err instanceof MongoError) {
            if ((err as MongoError).code == 11000) {
                throw new ElementAlreadyExistsError();
            }
        }
        throw err;
    }
}

export async function getApi(apiId: string): Promise<IApi & Document> {
    logger.info(`Trying to retrieve api with id ${apiId}`);

    try {
        const api = await Api.findById(apiId);
        if (api !== null) {
            return api;
        } else {
            throw new NoSuchElementError(`No api with id "${apiId}" was found in the database.`);
        }
    } catch (err) {
        logger.error(`Error while retrieving api with id ${apiId} from database: `, err);
        throw err;
    }
}

export async function getApis(type?: ApiType): Promise<Array<IApi & Document>> {
    logger.info(`Trying to retrieve all apis${type ? ` with type ${type}` : ''}`);

    try {
        const apis = await Api.find(type ? { type } : {});
        return apis || [];
    } catch (err) {
        logger.error(`Error while retrieving all apis${type ? ` with type ${type}` : ''} from database: `, err);
        throw err;
    }
}

export async function updateApi(apiData: IApi) {
    logger.info(`Trying to update api with id ${apiData.id}`);

    try {
        const api = await Api.findByIdAndUpdate(apiData.id, apiData);
        if (api !== null) {
            logger.info(`Api "${apiData.id}" was updated successfully.`);
        } else {
            throw new NoSuchElementError(`Api with id "${apiData.id}" was not found in the database.`);
        }
    } catch (err) {
        logger.error(`Error while updating api with id ${apiData.id}: `, err);
        throw err;
    }
}

export async function deleteApi(apiId: string) {
    logger.info(`Trying to delete api with id ${apiId}`);

    try {
        const api = await Api.findByIdAndDelete(apiId);
        if (api !== null) {
            logger.info(`Api "${apiId}" was deleted successfully.`);
        } else {
            throw new NoSuchElementError(`Api with id "${apiId}" was not deleted because it does not exist.`);
        }
    } catch (err) {
        logger.error(`Error while deleting api with id ${apiId}: `, err);
        throw err;
    }
}
