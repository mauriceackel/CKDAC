import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import * as UserService from '../services/UserService'
import { IUser } from '../models/UserModel'
import { ForbiddenError } from '../utils/errors/ForbiddenError';
import { NoSuchElementError } from '../utils/errors/NoSuchElementError';
import { ElementAlreadyExistsError } from '../utils/errors/ElementAlreadyExistsError';
import { ApiResponse, ErrorResponse, SuccessResponse } from '../utils/responses/ApiResponse';
import { MultiUserResponse, SingleUserResponse } from '../utils/responses/UserResponse';
import { userEndpoint } from '../config/Config';
import { logger } from '../Service';

const router: Router = Router();

/**
 * Create user
 */
router.post('/', createUser);
async function createUser(req: Request, res: Response, next: NextFunction) {

    let userData: IUser = req.body;

    let response: ApiResponse;
    try {
        let user = await UserService.createUser(userData);
        res.header('Location', `/${userEndpoint}/${user.id}`);
        response = new SuccessResponse(201);
    } catch (err) {
        logger.error(err);
        if (err instanceof ElementAlreadyExistsError) {
            response = new ErrorResponse(409);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

/**
 * Get all existing users
 */
router.get('/', getUsers)
const listCondition = (user: IUser, userId: string) => true;
async function getUsers(req: Request, res: Response, next: NextFunction) {

    let response: ApiResponse;
    try {
        const users = await UserService.getUsers(req.query);

        if (users.some(user => !listCondition(user, req.userId))) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        response = new MultiUserResponse(200, undefined, users.map(u => u.toJSON({ claims: [...req.claims, ...(u.id === req.userId ? ['owner'] : [])] })));
    } catch (err) {
        logger.error(err);
        response = new ErrorResponse(500);
    }
    res.status(response.Code).json(response);
}

/**
 * Get a specific user by his userId
 */
router.get('/:userId', getUser)
const getCondition = (user: IUser, userId: string, claims: string[]) => claims.includes('admin') || (user.id === userId);
async function getUser(req: Request, res: Response, next: NextFunction) {

    let response: ApiResponse;
    try {
        const user = await UserService.getUserById(req.params.userId);

        if (!getCondition(user, req.userId, req.claims)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        response = new SingleUserResponse(200, undefined, user.toJSON({ claims: [...req.claims, ...(user.id === req.userId ? ['owner'] : [])] }));
    } catch (err) {
        logger.error(err);
        if (err instanceof NoSuchElementError) {
            response = new ErrorResponse(404);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

/**
 * Update a user
 */
router.put('/:userId', updateUser)
const updateCondition = (user: IUser, userId: string, data: IUser) => user.id === userId;
async function updateUser(req: Request, res: Response, next: NextFunction) {

    const userData: IUser = req.body;
    userData.id = req.params.userId;

    let response: ApiResponse;
    try {
        const user = await UserService.getUserById(req.params.userId);

        if (!updateCondition(user, req.userId, userData)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        await UserService.updateUser(userData);

        response = new SuccessResponse(200);
    } catch (err) {
        logger.error(err);
        if (err instanceof NoSuchElementError) {
            response = new ErrorResponse(404);
        } else {
            response = new ErrorResponse(500);
        }
    }
    res.status(response.Code).json(response);
}

/**
 * Remove a user
 */
router.delete('/:userId', deleteUser)
const deleteCondition = (user: IUser, userId: string) => user.id === userId;
async function deleteUser(req: Request, res: Response, next: NextFunction) {

    let response: ApiResponse;
    try {
        const user = await UserService.getUserById(req.params.userId);

        if (!deleteCondition(user, req.userId)) {
            throw new ForbiddenError("Insufficient right, permission denied");
        }

        await UserService.deleteUser(req.params.userId);
        response = new SuccessResponse(204);
    } catch (err) {
        logger.error(err);
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