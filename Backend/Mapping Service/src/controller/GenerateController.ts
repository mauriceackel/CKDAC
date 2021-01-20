import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import { ApiResponse, ErrorResponse } from '../utils/responses/ApiResponse';
import * as GeneratorService from '../services/MappingGenerator/MappingGeneratorService'
import { SingleMappingResponse } from '../utils/responses/MappingResponse';
import { MappingDirection } from '../models/MappingModel';
import { IOperation } from '../models/OperationModel';

//Reference to express
const router: Router = Router();

/**
 * Generate a mapping
 */
router.post('/', generateMapping)
async function generateMapping(req: Request, res: Response, next: NextFunction) {

    const { source, targets, direction } = req.body as { source: IOperation, targets: { [key: string]: IOperation }, direction?: MappingDirection };

    let response: ApiResponse;
    try {
        const mapping = await GeneratorService.generateMapping(source, targets, direction);

        response = new SingleMappingResponse(200, undefined, mapping);
    } catch (err) {
        response = new ErrorResponse(500, [err]);
    }
    res.status(response.Code).json(response);
}

export default router;