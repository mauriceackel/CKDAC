import jwt from 'jsonwebtoken';
import * as Config from '../config/Config';
import { RefreshToken } from '../models/RefreshTokenModel';
import { InvalidTokenError } from '../utils/errors/InvalidTokenError';
import { logger } from '../Service';

/**
 * Generate a refresh token for creation of access tokens.
 * 
 * @param userId The userId of the user that issued the token.
 * @returns An random base64 encoded token with 128 bytes of data.
 * @throws MongooseError if storing the refresh token fails.
 */
export async function generateRefreshToken(userId: string) {
    logger.info(`Creating refresh token for user ${userId}`);
    //Generate the random token
    let refreshToken = RefreshToken.createTokenValue();
    try {
        //Override currently stored refresh token of user or create a new token if it does not yet exist
        await RefreshToken.findOneAndUpdate({
            userId: userId
        },{
            userId: userId,
            token: refreshToken,
            //Refresh token has a limited lifespan
            expiryDate: new Date(Date.now() + Config.REFRESH_TOKEN_TTL)
        }, {
            upsert: true
        });
        logger.info(`Successfully created refresh token for user ${userId}`);
    } catch (err) {
        logger.error(`Error while creating refresh token for user ${userId}`, err);
        throw err;
    }
    return refreshToken;
}

/**
 * Generate an access token for the subsequent api requests. Checks if the provided refresh token exists and is valid.
 * 
 * @param refreshToken The refresh token for which the access token should be created.
 * @retrun A signed JWT which holds the userId of the issuer and is valid for a limited timespan.
 * @throws InvalidTokenError If the refresh token is not valid anymore.
 */
export async function generateAccessToken(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
    logger.info(`Trying to create new access token for ${refreshToken}.`);

    let refreshTokenModel = await validateRefreshToken(refreshToken);
    logger.info(`Renewing refresh token and creating new access token.`);
    refreshTokenModel.renew();

    return {
        accessToken: jwt.sign({
            exp: Math.floor((Date.now() + Config.ACCESS_TOKEN_TTL) / 1000),
            userId: refreshTokenModel.userId
        }, Config.ACCESS_TOKEN_PRIV, { algorithm: 'RS512' }),
        refreshToken: refreshTokenModel.token
    }
}
export interface IAccessToken {
    userId: string
}

/**
 * Generate a short-lifed token that can be used to reset a users password.
 * 
 * @param userId The userId of the user who issued the reset token.
 * @retrun A signed JWT which holds the userId of the issuer, a pw reset flag and is valid for a limited timespan.
 */
export async function generatePwResetToken(userId: string) {
    return jwt.sign({
        exp: Math.floor((Date.now() + Config.PW_TOKEN_TTL) / 1000),
        userId: userId,
        resetPassword: true
    }, Config.ACCESS_TOKEN_PRIV, { algorithm: 'RS512' });
}
export interface IResetToken {
    userId: string,
    resetPassword: boolean
}

/**
 * Checkes the validity (i.e. integrity & expiry) of the provided access token.
 * 
 * @param accessToken The JWT to validate.
 * @returns The payload of the JWT.
 * @throws InvalidTokenError if the token is not valid for any reason.
 */
export function validateAccessToken(accessToken: string) {
    logger.info(`Trying to validate access token: ${accessToken}`);
    try {
        let payload = jwt.verify(accessToken, Config.ACCESS_TOKEN_PUB, { algorithms: ['RS512'] });
        logger.info(`Access token valid. Payload: `, payload);
        return payload;
    } catch (err) {
        logger.error(`Invalid authentication request. The access token is invalid.`);
        throw new InvalidTokenError("invalid_token", "The bearer token that was provided either expired or was manipulated.")
    }
}

/**
 * Checkes the validity (i.e. expiry) of the provided refresh token.
 * 
 * @param refreshToken The token to validate.
 * @throws InvalidTokenError if the token is not valid for any reason.
 */
export async function validateRefreshToken(refreshToken: string) {
    logger.info(`Trying to validate refresh token: ${refreshToken}`);

    let refreshTokenModel = await RefreshToken.findOne({ token: refreshToken });
    if (refreshTokenModel && refreshTokenModel.isValid()) {
        //Token exists and is valid so give the user a new access token and renew the refresh token
        logger.info(`Refresh token for user ${refreshTokenModel.userId} valid.`);
        return refreshTokenModel;
    } else {
        logger.error(`Refresh token did not exist or wasn't valid.`);
        throw new InvalidTokenError("invalid_token", "Refresh token does not exist or is invalid");
    }
}

/**
 * Checkes the invalidates a refresh token (by deleting it).
 * 
 * @param userId The id of the user the refresh token should be deleted for.
 * @throws InvalidTokenError if the token is not valid for any reason.
 */
export async function invalidateRefreshToken(userId: string) {
    logger.info(`Trying to invalidate refresh token for user: ${userId}`);

    try {
        let deleteResult = await RefreshToken.deleteMany({ userId: userId });

        if(deleteResult.ok === 1) {
            logger.info(`#${deleteResult.n} refresh token(s) for user ${userId} were invalidated successfully.`);
        } else {
            throw Error("Error while deleting refresh token");
        }

    } catch (err) {
        logger.error(`Error while deleting refresh token for user ${userId} `, err);
        throw err;
    }
}