import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import * as TokenService from '../services/TokenService';
import { ApiResponse, ErrorResponse, SuccessResponse } from '../utils/responses/ApiResponse';

const router: Router = Router();

router.all('/', logout);
async function logout(req: Request, res: Response, next: NextFunction) {
    let userId = req.userId;

    let response: ApiResponse;
    try {
        await TokenService.invalidateRefreshToken(userId);

        response = new SuccessResponse(200);
    } catch (err) {
        response = new ErrorResponse(500);
    }
    res.status(response.Code).json(response);
}

export default router;