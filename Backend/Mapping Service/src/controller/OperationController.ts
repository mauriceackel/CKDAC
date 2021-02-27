import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import { ApiResponse, ErrorResponse } from '../utils/responses/ApiResponse';
import * as MappingService from '../services/MappingService'
import { ApiType } from '../models/ApiModel';
import { MappedOperationsResponse } from '../utils/responses/MappedOperationsResponse';

//Reference to express
const router: Router = Router();

/**
 * Get mapped operations
 */
router.post('/', getMappedOperations)
async function getMappedOperations(req: Request, res: Response, next: NextFunction) {
    const { apiType, sourceId, targetApiId } = req.body as { apiType: ApiType, sourceId: string, targetApiId: string };

    let response: ApiResponse;
    try {
        const mappedOperations = await MappingService.getMappedOperations(apiType, sourceId, targetApiId);

        response = new MappedOperationsResponse(200, undefined, mappedOperations);
    } catch (err) {
        response = new ErrorResponse(500, [err]);
    }
    res.status(response.Code).json(response);
}

export default router;