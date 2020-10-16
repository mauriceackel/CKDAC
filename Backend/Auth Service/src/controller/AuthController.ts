import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect';
import * as TokenService from '../services/TokenService';
import * as UserService from '../services/UserService';
import { ForeignServiceError } from '../utils/errors/ForeignServiceError';
import { ErrorResponse, ApiResponse } from '../utils/responses/ApiResponse';
import { TokenResponse } from '../utils/responses/TokenResponse';

const router: Router = Router();

/**
 * Authenticate a user by his email and password and return the access and refresh tokens.
 */
router.post('/', authenticate);
async function authenticate(req: Request, res: Response, next: NextFunction) {
    let loginData = req.body;

    let response : ApiResponse;
    if (loginData.email && loginData.password) {
        try {
            let authenticatedUser = await UserService.validateCredentials(loginData.email, loginData.password);
            
            //Create initial refresh token and issue an access token with it
            let tokens = await TokenService.generateAccessToken(await TokenService.generateRefreshToken(authenticatedUser.id!));
        
            response = new TokenResponse(200, undefined, tokens.accessToken, tokens.refreshToken);
        } catch (err) {
            if(err instanceof ForeignServiceError) {
                response = new ErrorResponse(err.status, [err.message]);
            } else {
                response = new ErrorResponse(500);
            }
        }
    } else {
        response = new ErrorResponse(400, ["No email or password key was specified."]);
    }
    res.status(response.Code).json(response);
}

export default router;