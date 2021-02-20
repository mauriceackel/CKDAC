import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import { IUser, UserType } from '../models/UserModel';
import * as RegisterService from '../services/RegisterService';
import * as TokenService from '../services/TokenService';
import { NoSuchElementError } from '../utils/errors/NoSuchElementError';
import { authenticationPrerequisites, authenticate } from '../middleware/Authentication';
import { ApiResponse, SuccessResponse, ErrorResponse } from '../utils/responses/ApiResponse';
import { TokenResponse } from '../utils/responses/TokenResponse';
import { ElementAlreadyExistsError } from '../utils/errors/ElementAlreadyExistsError';

const router: Router = Router();

/**
 * Completely register a new user
 */
router.post('/', registerUser);
async function registerUser(req: Request, res: Response, next: NextFunction) {
    let userData = req.body as IUser;
    userData.type = UserType.STANDARD;

    let response: ApiResponse;
    try {
        await RegisterService.registerUser(userData);
        response = new SuccessResponse(200);
    } catch (err) {
        if(err instanceof ElementAlreadyExistsError) {
            response = new ErrorResponse(409, ["A user with this email already exists"]);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

export default router;