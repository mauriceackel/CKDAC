import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import * as TokenService from '../services/TokenService';
import { InvalidTokenError } from '../utils/errors/InvalidTokenError';
import { ApiResponse, ErrorResponse } from '../utils/responses/ApiResponse';
import { TokenResponse } from '../utils/responses/TokenResponse';

const router: Router = Router();

router.all('/', renewToken);
async function renewToken(req: Request, res: Response, next: NextFunction) {
    let refreshToken = req.authSecret;
    let response : ApiResponse;
    try {
        let tokens = await TokenService.generateAccessToken(refreshToken);
        response = new TokenResponse(200, undefined, tokens.accessToken, tokens.refreshToken);
    } catch (err) {
        if (err instanceof InvalidTokenError) {
            response = new ErrorResponse(401, [err.message, err.description]);
            res.header('WWW-Authenticate', `Bearer error="${err.message}" error_description="${err.description}"`);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

export default router;