import { Request, Response } from "express";
import { NextFunction } from "connect";
import jwt from 'jsonwebtoken';
import * as Config from '../config/Config'
import * as AuthenticationService from '../services/AuthenticationService';
import * as KeyService from '../services/KeyService';
import * as TokenService from '../services/TokenService';
import { logger } from "../Service";
import { ErrorResponse } from "../utils/responses/ApiResponse";
import { InvalidTokenError } from "../utils/errors/InvalidTokenError";
import { BadAuthenticationMethodError } from "../utils/errors/BadAuthenticationMethodError";
import { InvalidApiKeyError } from "../utils/errors/InvalidApiKeyError";

declare global {
    namespace Express {
        interface Request {
            userId: string
            authType: AuthenticationService.AuthType
            authSecret: string,
        }
    }
}

/**
 * Checks incoming requests for an authorization header and the "Bearer" auth type.
 * Returns a 401 if any validation step fails. Adds the auth token to the request if all validation steps pass.
 */
export async function authenticationPrerequisites(req: Request, res: Response, next: NextFunction) {
    let authHeader = req.headers['authorization'];

    try {
        let authInfo = AuthenticationService.parseHeader(authHeader);
        req.authType = authInfo.type;
        req.authSecret = authInfo.secret;
        next();
    } catch (err) {
        let response: ErrorResponse;
        if (err instanceof BadAuthenticationMethodError) {
            response = new ErrorResponse(401, [err.message, err.description]);
            res.header('WWW-Authenticate', `error="${err.message}" error_description="${err.description}"`);
        } else {
            response = new ErrorResponse(500);
        }
        res.status(response.Code).json(response);
    }
}

/**
 * Checks if the provided auth secret is valid. If yes, returns 200 if no, returns 401 response.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        switch (req.authType) {
            case AuthenticationService.AuthType.BEARER: {
                let payload = await TokenService.validateAccessToken(req.authSecret) as any;
                req.userId = payload.userId;
            } break;
            case AuthenticationService.AuthType.API_KEY: {
                let servicename = await KeyService.validateApiKey(req.authSecret);
                req.userId = servicename;
            } break;
            default: throw new Error("Unknown auth type");
        }
        return next();
    } catch (err) {
        let response: ErrorResponse;
        if (err instanceof InvalidTokenError || err instanceof InvalidApiKeyError) {
            response = new ErrorResponse(401, [err.message, err.description]);
            res.header('WWW-Authenticate', `error="${err.message}" error_description="${err.description}"`);
        } else {
            response = new ErrorResponse(500);
        }
        res.status(response.Code).json(response);
    }
}
