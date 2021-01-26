import { Request, Response } from "express";
import { NextFunction } from "connect";
import * as Config from '../config/Config';
import axios from 'axios';
import { logger } from "../Service";
import { ErrorResponse } from "../utils/responses/ApiResponse";

export async function externalAuth(req: Request, res: Response, next: NextFunction) {
    const { headers, body } = req;

    if(req.bypassAuth) {
        next();
        return;
    }
    
    // Call auth service, pass headers and body
    try {
        const authResponse = await axios.post(
            `http://${Config.AUTH_SERVICE_URL}/`,
            body,
            { 
                headers,
                // Don't fail for return values we actually expect. This lets us only catch hard errors in catch
                validateStatus: (status) => (status >= 200 && status < 300) || status === 401 || status === 403
            }
        );

        // Check auth result
        const { status, headers: authHeaders } = authResponse;

        if (status !== 200) {
            const response = new ErrorResponse(status);

            // Set all response headers
            Object.entries(authHeaders as { [key: string]: string }).forEach(([key, value]) => res.header(key, value));

            res.status(response.Code).json(response);
            return;
        }

        // Set all request headers
        Object.entries(authHeaders as { [key: string]: string }).forEach(([key, value]) => req.headers[key] = value);

        // Caller is authenticated
        next();
    } catch (err) {
        logger.error(err);
        const response = new ErrorResponse(500, ['Unknown error']);
        res.status(response.Code).json(response);
        return;
    }
}
