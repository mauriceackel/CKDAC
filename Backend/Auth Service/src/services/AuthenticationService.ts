import { logger } from "../Service";
import { BadAuthenticationMethodError } from "../utils/errors/BadAuthenticationMethodError";

/**
 * Validates the authentication header and return the bearer token if it exists.
 * 
 * @param authHeader The raw authentication header.
 * @returns The bearer token if it exists
 * @throws BadAuthenticationMethodError If the auth header is not set or does not contain the Bearer keyword
 * 
 */
export function parseHeader(authHeader: string | undefined) : IAuthInformation{
    logger.info(`Trying to retrieve bearer token from auth header: ${authHeader}`);

    if (authHeader) {
        if (authHeader.startsWith("Bearer")) {
            let token = authHeader.substr("Bearer ".length);
            logger.info(`Auth token ${token} was retrieved successfully.`);
            return {type: AuthType.BEARER, secret: token};
        } else if (authHeader.startsWith("ApiKey")) {
            let key = authHeader.substr("ApiKey ".length);
            logger.info(`API key ${key} was retrieved successfully.`);
            return {type: AuthType.API_KEY, secret: key};
        } else {
            logger.error(`Invalid authentication request. Wrong auth method used.`);
            throw new BadAuthenticationMethodError("not_supported", "The authentication method you used is not supported. Please use bearer auth or API key.");
        }
    } else {
        logger.info(`Invalid authentication request. No auth header provided.`);
        throw new BadAuthenticationMethodError("no_auth_header.", "Please set the authorization header.");
    }
}

export interface IAuthInformation {
    type: AuthType,
    secret: string
}

export enum AuthType {
    BEARER, API_KEY
}