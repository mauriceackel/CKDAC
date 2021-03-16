import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import { NoSuchElementError } from '../utils/errors/NoSuchElementError';
import { ApiResponse, ErrorResponse, SuccessResponse } from '../utils/responses/ApiResponse';
import * as MappingService from '../services/MappingService'
import { ForbiddenError } from '../utils/errors/ForbiddenError';
import { MultiMappingResponse, SingleMappingResponse } from '../utils/responses/MappingResponse';
import { IMapping } from '../models/MappingModel';

//Reference to express
const router: Router = Router();

/**
 * Create a mapping
 */
router.post('/', createMapping)
const createCondition = (mapping: IMapping | undefined, userId: string, data: IMapping) => data.createdBy === userId;
async function createMapping(req: Request, res: Response, next: NextFunction) {

    const mappingData: IMapping = req.body;

    let response: ApiResponse;
    try {
        if (!createCondition(undefined, req.userId, mappingData)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        const mapping = await MappingService.createMapping(mappingData);

        response = new SingleMappingResponse(200, undefined, mapping.toJSON({ claims: [...req.claims, ...(mapping.createdBy === req.userId ? ['owner'] : [])] }));
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
 * Get all mappings
 */
router.get('/', getMappings)
const listCondition = (mapping: IMapping, userId: string) => true;
async function getMappings(req: Request, res: Response, next: NextFunction) {

    let response: ApiResponse;
    try {
        const { apiType: rawApiType, createdBy } = req.query as Record<string, any>;

        const mappings = await MappingService.getMappings({ apiType: rawApiType ? Number.parseInt(rawApiType): undefined, createdBy });

        if (mappings.some(mapping => !listCondition(mapping, req.userId))) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        response = new MultiMappingResponse(200, undefined, mappings.map(mapping => mapping.toJSON({ claims: [...req.claims, ...(mapping.createdBy === req.userId ? ['owner'] : [])] })));
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
 * Get a specific mapping by its id
 */
router.get('/:mappingId', getMapping)
const getCondition = (mapping: IMapping, userId: string) => true;
async function getMapping(req: Request, res: Response, next: NextFunction) {

    let response: ApiResponse;
    try {
        const mapping = await MappingService.getMapping(req.params.mappingId);

        if (!getCondition(mapping, req.userId)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        response = new SingleMappingResponse(200, undefined, mapping.toJSON({ claims: [...req.claims, ...(mapping.createdBy === req.userId ? ['owner'] : [])] }));
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
 * Update a mapping
 */
router.put('/:mappingId', updateApi)
const updateCondition = (mapping: IMapping, userId: string, data: IMapping) => mapping.createdBy === userId && mapping.createdBy === data.createdBy;
async function updateApi(req: Request, res: Response, next: NextFunction) {

    const mappingData: IMapping = req.body;
    mappingData.id = req.params.mappingId;

    let response: ApiResponse;
    try {
        const mapping = await MappingService.getMapping(req.params.mappingId);

        if (!updateCondition(mapping, req.userId, mappingData)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        await MappingService.updateMapping(mappingData);

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
 * Delete a mapping
 */
router.delete('/:mappingId', deleteMapping)
const deleteCondition = (mapping: IMapping, userId: string) => mapping.createdBy === userId;
async function deleteMapping(req: Request, res: Response, next: NextFunction) {

    let response: ApiResponse;
    try {
        const mapping = await MappingService.getMapping(req.params.mappingId);

        if (!deleteCondition(mapping, req.userId)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        await MappingService.deleteMapping(req.params.mappingId);

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