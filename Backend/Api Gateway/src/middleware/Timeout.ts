import { Request, Response } from "express";
import { NextFunction } from "connect";

export async function stopOnTimeout(req: Request, res: Response, next: NextFunction) {
    if(req.timedout) {
        return;
    }

    next();
}
