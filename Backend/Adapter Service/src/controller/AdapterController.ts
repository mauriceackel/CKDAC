import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import { NoSuchElementError } from '../utils/errors/NoSuchElementError';
import { ApiResponse, ErrorResponse, SuccessResponse } from '../utils/responses/ApiResponse';
import * as AdapterService from '../services/Adapter/AdapterService'
import { logger } from '../Service';
import { IMapping } from '../models/MappingModel';
import { AdapterResponse } from '../utils/responses/AdapterResponse';
import { AdapterType } from '../utils/enums/AdapterTypes';

//Reference to express
const router: Router = Router();

router.post('/:adapterType', createAdapter);
async function createAdapter(req: Request, res: Response, next: NextFunction) {
    const mapping: IMapping | undefined = req.body.mapping;

    let response: ApiResponse;
    if (mapping) {
        try {
            const fileId = await AdapterService.createAdapter(req.params.adapterType as AdapterType, mapping, req.userId);

            response = new AdapterResponse(200, undefined, fileId);
        } catch (err) {
            logger.error(err);
            if(err instanceof NoSuchElementError) {
                response = new ErrorResponse(404, [err.message]);
            } else {
                response = new ErrorResponse(500);
            }
        }
    } else {
        logger.error("No mapping data provided");
        response = new ErrorResponse(400, ["No mapping data provided"]);
    }
    res.status(response.Code).json(response);
}

export default router;