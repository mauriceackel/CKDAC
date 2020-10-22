import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import * as UserService from '../services/UserService'
import { IUser } from '../models/UserModel'
import { NoSuchElementError } from '../utils/errors/NoSuchElementError';
import { ElementAlreadyExistsError } from '../utils/errors/ElementAlreadyExistsError';
import { InvalidCredentialsError } from '../utils/errors/InvalidCredentialsError';
import { ApiResponse, ErrorResponse } from '../utils/responses/ApiResponse';
import { SingleUserResponse } from '../utils/responses/UserResponse';

const router: Router = Router();

/**
 * Validate credentials
 */
router.post('/', validateCredentials);
async function validateCredentials(req: Request, res: Response, next: NextFunction) {
    let loginData = req.body;

    let response: ApiResponse;

    if (loginData.email && loginData.password) {
        try {
            let authenticatedUser = await UserService.validateCredentials(loginData.email, loginData.password);
            response = new SingleUserResponse(200, undefined, authenticatedUser.toJSON({ claims: [...req.claims, ...(authenticatedUser.id === req.userId ? ['owner'] : [])] }));
        } catch (err) {
            if (err instanceof NoSuchElementError) {
                //TODO: Could be seperate error messages for better user experience (but less security)
                response = new ErrorResponse(401);
            } else if (err instanceof InvalidCredentialsError) {
                //TODO: Could be seperate error messages for better user experience (but less security)
                response = new ErrorResponse(401);
            } else {
                response = new ErrorResponse(500);
            }
        }
    } else {
        response = new ErrorResponse(400, ["Email or password missing"]);
    }
    res.status(response.Code).json(response);
}

export default router;