import { Request, Response, Router } from 'express'
import { NextFunction } from 'connect'
import * as UserService from '../services/UserService';
import * as TokenService from '../services/TokenService';
import { authHost, ACCESS_TOKEN_PUB } from '../config/Config';
import { ApiResponse, SuccessResponse, ErrorResponse } from '../utils/responses/ApiResponse';
import nodemailer from 'nodemailer';
import { ResetTokenResponse } from '../utils/responses/TokenResponse';
import { NoSuchElementError } from '../utils/errors/NoSuchElementError';
import { authenticationPrerequisites, authenticate } from '../middleware/Authentication';
import { ForeignServiceError } from '../utils/errors/ForeignServiceError';
import jwt from 'jsonwebtoken';

const router: Router = Router();

const mailTransporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
});

/**
 * Issue a password forgot token.
 */
router.post('/forgot', forgotPassword);
async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    let email = req.body.email;

    let response: ApiResponse;
    if (email) {
        try {
            let user = await UserService.getUserByEmail(email);
            let resetToken = await TokenService.generatePwResetToken(user.id!);

            await new Promise((resolve, reject) => mailTransporter.sendMail({
                from: 'noreply@puppetmaster.com',
                to: email,
                subject: 'Message',
                text: `You can set a new password using the following link: https://${authHost}/password/reset?resetToken=${resetToken}`
            }, (err, info) => {
                if(err) return reject(err);
                return resolve();
            }));
            response = new ResetTokenResponse(200, undefined, resetToken);
        } catch (err) {
            if (err instanceof NoSuchElementError) {
                //If we don't find a user with the given email, report success back anyways
                response = new SuccessResponse(200);
            } else {
                response = new ErrorResponse(500);
            }
        }
    } else {
        response = new ErrorResponse(400, ["No email provided"]);
    }
    res.status(response.Code).json(response);
}

/**
 * Reset a user's password.
 */
router.post('/reset', authenticationPrerequisites, authenticate, resetPassword);
async function resetPassword(req: Request, res: Response, next: NextFunction) {
    let password = req.body.password;

    let response: ApiResponse;
    if (password) {
        //Validate the passwordreset token
        try {
            let tokenData = jwt.verify(req.authSecret, ACCESS_TOKEN_PUB, { algorithms: ['RS512'] }) as TokenService.IResetToken;
            if (tokenData.userId && tokenData.resetPassword) {
                try {
                    await UserService.setPassword(tokenData.userId, password);
                    response = new SuccessResponse(200);
                } catch (err) {
                    if (err instanceof ForeignServiceError) {
                        response = new ErrorResponse(err.status, [err.message]);
                    } else {
                        response = new ErrorResponse(500);
                    }
                }
            } else {
                response = new ErrorResponse(400, ["The reset token has a wrong format."]);
            }
        } catch (err) {
            response = new ErrorResponse(401, ["The provided reset token is invalid."]);
        }
    } else {
        response = new ErrorResponse(400, ["No password provided"]);
    }
    res.status(response.Code).json(response);
}

export default router;