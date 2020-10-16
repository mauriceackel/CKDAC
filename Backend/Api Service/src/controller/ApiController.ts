import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import { NoSuchElementError } from '../utils/errors/NoSuchElementError';
import { ApiResponse, ErrorResponse, SuccessResponse } from '../utils/responses/ApiResponse';
import * as ApiService from '../services/ApiService'
import { ForbiddenError } from '../utils/errors/ForbiddenError';
import { IApi } from '../models/ApiModel';
import { MultiApiResponse, SingleApiResponse } from '../utils/responses/ApiDataResponse';

//Reference to express
const router: Router = Router();

/**
 * Create an api
 */
router.post('/', createApi)
const createCondition = (api: IApi | undefined, userId: string, data: IApi) => data.createdBy === userId;
async function createApi(req: Request, res: Response, next: NextFunction) {

    const apiData: IApi = req.body;

    let response: ApiResponse;
    try {
        if (!createCondition(undefined, req.userId, apiData)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }
        
        const api = await ApiService.createApi(apiData);
        
        response = new SingleApiResponse(200, undefined, api);
    } catch (err) {
        if (err instanceof NoSuchElementError) {
            response = new ErrorResponse(404);
        } else if (err instanceof ForbiddenError) {
            response = new ErrorResponse(403);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

/**
 * Get all apis
 */
router.get('/', getApis)
const listCondition = (api: IApi, userId: string) => true;
async function getApis(req: Request, res: Response, next: NextFunction) {

    let response: ApiResponse;
    try {
        const apis = await ApiService.getApis(req.query.type);

        if (apis.some(api => !listCondition(api, req.userId))) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        response = new MultiApiResponse(200, undefined, apis);
    } catch (err) {
        if (err instanceof NoSuchElementError) {
            response = new ErrorResponse(404);
        } else if (err instanceof ForbiddenError) {
            response = new ErrorResponse(403);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

/**
 * Get a specific api by its id
 */
router.get('/:apiId', getApi)
const getCondition = (api: IApi, userId: string) => true;
async function getApi(req: Request, res: Response, next: NextFunction) {

    let response: ApiResponse;
    try {
        const api = await ApiService.getApi(req.params.apiId);

        if (!getCondition(api, req.userId)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        response = new SingleApiResponse(200, undefined, api);
    } catch (err) {
        if (err instanceof NoSuchElementError) {
            response = new ErrorResponse(404);
        } else if (err instanceof ForbiddenError) {
            response = new ErrorResponse(403);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

/**
 * Update an api
 */
router.put('/:apiId', updateApi)
const updateCondition = (api: IApi, userId: string, data: IApi) => api.createdBy === userId && api.createdBy === data.createdBy;
async function updateApi(req: Request, res: Response, next: NextFunction) {

    const apiData: IApi = req.body;
    apiData.id = req.params.apiId;

    let response: ApiResponse;
    try {
        const api = await ApiService.getApi(req.params.apiId);

        if (!updateCondition(api, req.userId, apiData)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        await ApiService.updateApi(apiData);

        response = new SuccessResponse(200);
    } catch (err) {
        if (err instanceof NoSuchElementError) {
            response = new ErrorResponse(404);
        } else if (err instanceof ForbiddenError) {
            response = new ErrorResponse(403);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

/**
 * Delete an api
 */
router.delete('/:apiId', deleteApi)
const deleteCondition = (api: IApi, userId: string) => api.createdBy === userId;
async function deleteApi(req: Request, res: Response, next: NextFunction) {

    let response: ApiResponse;
    try {
        const api = await ApiService.getApi(req.params.apiId);

        if (!deleteCondition(api, req.userId)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        await ApiService.deleteApi(req.params.apiId);

        response = new SuccessResponse(200);
    } catch (err) {
        if (err instanceof NoSuchElementError) {
            response = new ErrorResponse(404);
        } else if (err instanceof ForbiddenError) {
            response = new ErrorResponse(403);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

export default router;