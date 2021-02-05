import { Request, Response } from "express";
import { NextFunction } from "connect";
import axios from 'axios';
import proxy from 'express-http-proxy';
import { logger } from "../Service";
import { ErrorResponse } from "../utils/responses/ApiResponse";

export async function redirect(req: Request, res: Response, next: NextFunction) {
    const { targetHost, targetPath } = req;

    proxy(targetHost, {
        proxyReqPathResolver: function (req) {
            return targetPath;
        }
    })(req, res, next);
}
