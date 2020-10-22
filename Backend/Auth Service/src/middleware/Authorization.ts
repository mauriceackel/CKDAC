import { Request, Response } from "express";
import { NextFunction } from "connect";
import * as AuthorizationService from '../services/AuthorizationService';
import { ErrorResponse } from "../utils/responses/ApiResponse";
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_PRIV, AUTH_DETAILS_TOKEN_TTL } from "../config/Config";
import { AuthType } from "../services/AuthenticationService";

/**
 * Checks an already authenticated request and checks for the access rights.
 * Returns a 403 if the user has no rights for this route. Sets the route-full-access header if the user has full access.
 */
export async function authorizeRequest(req: Request, res: Response, next: NextFunction) {
    //TODO: Determine better way of knowing if it is a user or a service
    let userType : UserType;
    switch(req.authType) {
        case AuthType.BEARER: {
            userType = UserType.USER;
        } break;
        case AuthType.API_KEY: {
            userType = UserType.SERVICE
        } break;
        default: throw new Error("Unknown auth type");
    }

    const claims = await AuthorizationService.checkPermissions(req.userId, userType, req.method, req.originalUrl);

    if (claims.length === 0) {
        const response = new ErrorResponse(403);
        return res.status(response.Code).json(response);
    } else {
        const authDetailsToken = getAuthDetailsToken(userType, req.userId, claims);
        
        res.header("auth-details", authDetailsToken);
        return next();
    }
}

export function getAuthDetailsToken(userType: UserType, userId: string, claims: string[]) {
    return jwt.sign({
        userType,
        userId,
        claims,
        exp: Math.floor((Date.now() + AUTH_DETAILS_TOKEN_TTL) / 1000)
    }, ACCESS_TOKEN_PRIV, { algorithm: "RS512" });
}

export enum UserType {
    SERVICE = "service",
    USER = "user"
}