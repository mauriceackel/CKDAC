import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import * as UserService from '../services/UserService'
import { IUser } from '../models/UserModel'
import { ForbiddenError } from '../utils/errors/ForbiddenError';
import { NoSuchElementError } from '../utils/errors/NoSuchElementError';
import { ElementAlreadyExistsError } from '../utils/errors/ElementAlreadyExistsError';
import { ApiResponse, ErrorResponse, SuccessResponse } from '../utils/responses/ApiResponse';
import { UserResponse, MultiUserResponse, SingleUserResponse } from '../utils/responses/UserResponse';
import { userEndpoint } from '../config/Config';
import { DocumentToObjectOptions } from 'mongoose';
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
async function getUsers(req: Request, res: Response, next: NextFunction) {
    
    let response: ApiResponse;
    try {
        let users = await UserService.getUsers(req.query);
        response = new MultiUserResponse(200, undefined, users.map(u => u.toJSON({ userId: req.userId, accessLevel: req.accessLevel })));
    } catch (err) {
        response = new ErrorResponse(500);
    }
    res.status(response.Code).json(response);
}

/**
 * Get a specific user by his userId
 */
router.get('/:userId', getUser)
async function getUser(req: Request, res: Response, next: NextFunction) {
    
    let response: ApiResponse;
    try {
        let user = await UserService.getUserById(req.params.userId);
        response = new SingleUserResponse(200, undefined, user.toJSON({ userId: req.userId, accessLevel: req.accessLevel }));
    } catch (err) {
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
async function updateUser(req: Request, res: Response, next: NextFunction) {
    
    let userData: IUser = req.body;
    userData.id = req.params.userId;

    let response: ApiResponse;
    try {
        //If no admin and username does not match
        // if (userType > 0 && loggedInUser.username != userData.username) {
        //     logger.info(`Logged in user "${loggedInUser.username}" has no permissions to upsert user "${userData.username}".`);
        //     return res.status(403).send();
        // }

        await UserService.updateUser(userData);
        response = new SuccessResponse(200);
    } catch (err) {
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
async function deleteUser(req: Request, res: Response, next: NextFunction) {
    
    let response: ApiResponse;
    try {
        if (req.accessLevel < 1.7976931348623+308 - 1000 && req.userId !== req.params.userId) {
            logger.warn(`User with id ${req.userId} does not have rights to delete user with id ${req.params.id}`)
            throw new ForbiddenError("You don't have sufficient rights to delete that object")
        }

        await UserService.deleteUser(req.params.userId);
        response = new SuccessResponse(204);
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