import { logger } from "../Service";
import http, { AxiosError } from 'axios';
import { IUser } from "../models/UserModel";
import { ForeignServiceError } from "../utils/errors/ForeignServiceError";
import { NoSuchElementError } from "../utils/errors/NoSuchElementError";
import { MultiUserResponse, SingleUserResponse } from "../utils/responses/UserResponse";
import { validationEndpoint, usersEndpoint } from "../config/Config";
import { getAuthDetailsToken, UserType } from "../middleware/Authorization";

/**
 * Sets the password for the specified user.
 * 
 * @param userId The userId of the user to set the new password for.
 * @param password The new password for the user.
 */
export async function setPassword(userId: string, password: string) {
    logger.info(`Trying to changed password for user ${userId}.`);
    try {
        await http.put(`${usersEndpoint}/${userId}`, { password: password });
        logger.info(`Successfully changed password for user ${userId}.`);
    } catch (err) {
        let axiosError = err as AxiosError;
        logger.error(`Error while setting password for user: ${userId}`, err);
        throw new ForeignServiceError(axiosError.response!.status, axiosError.response!.data.error.msg);;
    }
}

/**
 * Validates the given user credentials.
 * 
 * @param email The email for which to calidate the password against.
 * @param password The password that should be checked for the given email.
 * @return IUser If the validation was successfull.
 * @throws ForeignServiceError If the request to the suer service was not successfull.
 */
export async function validateCredentials(email: string, password: string) {
    logger.info(`Trying to validate credentials for user with email ${email}.`)

    let credentials = {
        email: email,
        password: password
    }

    try {    
        let response = await http.post<SingleUserResponse>(`${validationEndpoint}`, credentials);
        let user = response.data.result.user as IUser;
        if (user) {
            logger.info(`Successfully validated credentials for user ${email}.`);
            return user;
        } else {
            throw new NoSuchElementError("No user received from user service.");
        }
    } catch (err) {
        logger.error(`Error while validating credentials for user ${email}`, err);
        if (err instanceof NoSuchElementError) {
            throw err;
        }
        let axiosError = err as AxiosError;
        throw new ForeignServiceError(axiosError.response!.status, axiosError.response!.data.err.msg);
    }
}

/**
 * Searches for a user with the given userId at the user service.
 * 
 * @param userId The id of the user that should be retrieved.
 * @returns IUser if a user with the given userId exists
 */
export async function getUserById(userId: string) {
    logger.info(`Trying to fetch user with userId ${userId} from user service.`)
    try {
        let response = await http.get<SingleUserResponse>(`${usersEndpoint}/${userId}`);
        if (response.status != 200) {
            throw new Error("Unable to fetch user.");
        }
        logger.info(`Successfully fetched user ${userId}.`);
        return response.data.result.user as IUser;
    } catch (err) {
        logger.error(`Error while fetching user ${userId}`, err);
        throw err;
    }
}

/**
 * Searches for a user with the given email at the user service.
 * 
 * @param email The email for which to search for.
 * @returns IUser if a user with the given email exists.
 */
export async function getUserByEmail(email: string) {
    logger.info(`Trying to fetch user with email ${email}.`);
    try {
        let user = await getUserByConditions([{ key: "email", value: email }]);
        logger.info(`Successfully fetched user with email ${email}.`);
        return user;
    } catch (err) {
        logger.error(`Error while fetching user with email ${email}`, err);
        throw err;
    }
}

/**
 * Searches for a user with the given condistions.
 * 
 * @param condistions A list of key value pairs. The keys represent a property of the user and the values the value that should be searched for the given propery.
 * @returns The first IUser if a user with the given conditions exists
 * @throws ForeignServiceError If the user service returns a status != 200
 * @throws NoSuchElementError If no user was found for the given conditions
 */
async function getUserByConditions(conditions: Array<{ key: string, value: string }>) {
    let query = conditions.map(e => `${e.key}=${e.value}`).join('&');

    try {
        let response = await http.get<MultiUserResponse>(`${usersEndpoint}?${query}`);

        let data = response.data.result.users as Array<IUser>;
        if (data[0]) {
            return data[0];
        } else {
            throw new NoSuchElementError(`No user found for conditions: ${conditions}`);
        }
    } catch (err) {
        if (err instanceof NoSuchElementError) {
            throw err;
        }
        let axiosError = err as AxiosError;
        throw new ForeignServiceError(axiosError.response!.status, axiosError.response!.data.err.msg);
    }
}