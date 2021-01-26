import { Request, Response } from "express";
import { NextFunction } from "connect";
import axios from 'axios';
import { logger } from "../Service";
import { ErrorResponse } from "../utils/responses/ApiResponse";

export async function redirect(req: Request, res: Response, next: NextFunction) {
    const { method, headers: reqHeaders, body: requestBody, targetRoute } = req;

    try {
        // Make call to target API
        const response = await axios.request({
            method,
            headers: reqHeaders,
            url: targetRoute,
            data: requestBody,
            // We don't want an error on any status here, as we want to pass the info to the caller
            validateStatus: () => true
        });
        
        const { status, headers: resHeaders, data: resBody } = response;

        // Set all response headers
        Object.entries(resHeaders as { [key: string]: string }).forEach(([key, value]) => res.header(key, value));

        // Set body and send response
        res.status(status).json(resBody);
        return;
    } catch (err) {
        logger.error(err);
        const response = new ErrorResponse(500, ['Unknown error']);
        res.status(response.Code).json(response);
        return;
    }
}
