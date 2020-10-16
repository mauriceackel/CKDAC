import { IUser, User, IUserModel } from "../models/UserModel";
import { NoSuchElementError } from "../utils/errors/NoSuchElementError";
import { logger } from "../Service";
import { MongoError } from "mongodb";
import { ElementAlreadyExistsError } from "../utils/errors/ElementAlreadyExistsError";
import { InvalidCredentialsError } from "../utils/errors/InvalidCredentialsError";

/**
 * Create a user with the given data.
 * 
 * @param userData The inital user data, in the correct format of the IUser interface.
 * @return The newly created user.
 */
export async function createUser(userData: IUser) {
    logger.info(`Trying to create new user with data: `, userData);

    try {
        let user = await User.create(userData);
        logger.info(`User created successfully!`);
        return user;
    } catch (err) {
        logger.error("Error while creating new user: ", err);
        if (err.code === 11000) {
            throw new ElementAlreadyExistsError();
        }
        throw err;
    }
}

/**
 * Get all existing users from the database.
 * 
 * @returns All existing users or an empty array.
 */
export async function getUsers(conditions: any) {
    logger.info(`Trying to retrieve all users from the database with conditions: `, conditions);

    try {
        let users = await User.find(conditions);
        if (users != null) {
            return users;
        } else {
            return [];
        }
    } catch (err) {
        logger.error("Error while retrieving all users from database: ", err);
        throw err;
    }
}

/**
 * Gets a specific user by its userId.
 * 
 * @param userId The userId for which to search.
 * @returns The user with the specified userId.
 * @throws NoSuchElementError if no user with the given userId exists.
 */
export async function getUserById(userId: string) {
    logger.info(`Trying to retrieve user "${userId}" from the database.`);

    try {
        let user = await User.findOne({
            _id: userId
        });
        if (user != null) {
            return user;
        } else {
            throw new NoSuchElementError(`User with id "${userId}" was not found in the database.`);
        }
    } catch (err) {
        logger.error(`Error while retrieving user "${userId}" from database: `, err);
        throw err;
    }

}

/**
 * Updates a user with the given data.
 * 
 * @param userData The user data that should be used to update the user, in the correct format of the IUser interface.
 * @returns The updated user.
 * @throws NoSuchElementError if no user with the given userId exists.
 */
export async function updateUser(userData: IUser) {
    logger.info(`Trying to update user "${userData.id}".`);

    try {
        let user = await User.findOneAndUpdate({ _id: userData.id }, userData);
        if (user != null) {
            logger.info(`User "${userData.id}" was updated successfully.`);
        } else {
            throw new NoSuchElementError(`User with id "${userData.id}" was not found in the database.`);
        }
    } catch (err) {
        logger.error(`Error while updating user "${userData.id}": `, err);
        throw err;
    }
}

/**
 * Delete the user with the specified user id from the database.
 * 
 * @param userId The userId of the user that should be deleted.
 * @throws NoSuchElementError if no user with the given userId exists.
 */
export async function deleteUser(userId: string) {
    logger.info(`Trying to delete user "${userId}".`);

    try {
        let user = await User.findOneAndDelete({ _id: userId });
        if (user != null) {
            logger.info(`User "${userId}" was deleted successfully.`);
        } else {
            throw new NoSuchElementError(`User "${userId}" was not deleted because it does not exist.`);
        }
    } catch (err) {
        logger.error(`Error while deleting user "${userId}": `, err);
        throw err;
    }
}

/**
 * Validates the given user credentials.
 * 
 * @param email The email for which to calidate the password against.
 * @param password The password that should be checked for the given email.
 * @return IUserModel If the validation was successfull.
 * @throws NoSuchElementError If there is no user with the given email.
 * @throws InvalidCredentialsError If there is no user with the given email.
 */
export async function validateCredentials(email: String, password: string) {
    logger.info(`Validating user credentials for user: ${email}`);

    try {
        let user = await User.findOne({ email: email }).select("+password");
        if (user == null) {
            throw new NoSuchElementError("No user with this email.");
        }
        if (!user.validatePassword(password)) {
            //TODO Prevent login after X bad attempts
            logger.warn(`Invalid login attempt for user ${email}.`);
            throw new InvalidCredentialsError("Wrong password.");
        }
        logger.info(`User credentials correct!`);
        return user;
    } catch (err) {
        logger.error(`Error while validating the credentials for user ${email} `, err);
        throw err;
    }
}