import { logger } from "../Service";
import http, { AxiosError } from 'axios';
import { ForeignServiceError } from "../utils/errors/ForeignServiceError";
import { apiEndpoint } from "../config/Config";
import { MultiApiResponse, SingleApiResponse } from "../utils/responses/ApiDataResponse";
import { ApiType, IApi } from "../models/ApiModel";

export async function getApiById(apiId: string) {
    logger.info(`Trying to fetch api with id ${apiId}`)
    try {
        const response = await http.get<SingleApiResponse>(`${apiEndpoint}/${apiId}`);
        
        logger.info(`Successfully fetched api ${apiId}.`);
        return response.data.result.api as IApi;
    } catch (err) {
        logger.error(`Error while fetching api ${apiId}`, err);
        const axiosError = err as AxiosError;
        throw new ForeignServiceError(axiosError.response!.status, axiosError.response!.data.err.msg);
    }
}

export async function getApis(type?: ApiType) {
    logger.info(`Trying to fetch all apis${type ? ` with type ${type}` : ''}`);

    try {
        const response = await http.get<MultiApiResponse>(`${apiEndpoint}${type ? `?type=${type}` : ''}`);
        const data = response.data.result.apis as Array<IApi>;

        logger.info(`Successfully fetched all apis${type ? ` with type ${type}` : ''}`);
        return data || [];
    } catch (err) {
        logger.error(`Error while fetching all apis${type ? ` with type ${type}` : ''}`);
        const axiosError = err as AxiosError;
        throw new ForeignServiceError(axiosError.response!.status, axiosError.response!.data.err.msg);
    }
}