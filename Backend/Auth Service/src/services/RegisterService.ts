import { IUser, UserType } from "../models/UserModel";
import http from 'axios';
import * as PermissionService from './PermissionService';
import { logger } from "../Service";
import { usersEndpoint, apiHost } from "../config/Config";
import { SingleUserResponse } from "../utils/responses/UserResponse";
import { ElementAlreadyExistsError } from "../utils/errors/ElementAlreadyExistsError";

export async function registerUser(userData: IUser) {
    logger.info(`Trying to register user with the following data:`, userData);
    try {
        let response = await http.post(`${usersEndpoint}`, userData);
        if (response.status == 201) {
            let userResponse = await http.get<SingleUserResponse>(`${apiHost}${response.headers.location}`)
            let user = userResponse.data.result.user as IUser;

            logger.info(`Successfully registered user ${user.id}`);
            let role;
            switch(user.type) {
                case UserType.STANDARD: role = "standard"; break;
                default: throw new Error("Unknown user type");
            }
            PermissionService.addUserToRole(user.id, role);

            return user;
        } else {
            throw new Error("Unable to create user");
        }
    } catch (err) {
        if(err.response && err.response.status == 409) {
            err = new ElementAlreadyExistsError("User with given email already exists")
        }
        logger.error(`Error while registering user`, err);
        throw err;
    }
}

export async function confirmEmail(userId: string) {
    logger.info(`Trying to confirm email addres of user ${userId}`);
    try {
        let response = await http.put(`${usersEndpoint}/${userId}`);
        if (response.status != 200) {
            throw new Error("Unable to update user.");
        }
        logger.info(`Successfully confirmed email address of user ${userId}`);
    } catch (err) {
        logger.error(`Error while confirming email address of user ${userId}`, err);
        throw err;
    }
}