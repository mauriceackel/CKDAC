import { Request, Response } from "express";
import { NextFunction } from "connect";
import * as RoutingService from '../services/RoutingService';
import { logger } from "../Service";
import { ErrorResponse } from "../utils/responses/ApiResponse";

declare global {
    namespace Express {
        interface Request {
            bypassAuth: boolean
            targetPath: string
            targetHost: string
        }
    }
}

export async function targetLookup(req: Request, res: Response, next: NextFunction) {
    const { hostname, originalUrl } = req;

    try {
        // Get route to forward to
        const routeData = await RoutingService.getRoutingTarget(hostname, originalUrl);

        if (routeData === undefined) {
            const response = new ErrorResponse(404, ['Not found']);
            res.status(response.Code).json(response);
            return;
        }

        const { bypassAuth, targetHost, targetPath } = routeData;
        req.targetPath = targetPath;
        req.targetHost = targetHost;
        req.bypassAuth = bypassAuth;

        next();
    } catch (err) {
        logger.error(err);
        const response = new ErrorResponse(500, ['Unknown error']);
        res.status(response.Code).json(response);
        return;
    }
}
