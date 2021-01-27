import Express, { Application } from 'express';
import bodyParser from 'body-parser';
import * as Config from './config/Config';
import https from 'https';
import http from 'http';
import timeout from 'connect-timeout';
import Winston, { format, transports, Logger } from 'winston';
import { externalAuth } from './middleware/ExternalAuth';
import { redirect } from './middleware/Redirect';
import { stopOnTimeout } from './middleware/Timeout';
import { targetLookup } from './middleware/TargetLookup';
import cors from 'cors';

export var logger: Logger;
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class Service {

    private static instance: Service;
    public static get Instance(): Service {
        return this.instance || (this.instance = new this());
    }

    private server?: https.Server | http.Server;
    private express: Application;
    private tlsCredentials: { key: string, cert: string };

    private running: boolean;

    private constructor() {
        this.running = false;
        this.express = Express();

        this.tlsCredentials = { key: Config.TLS_KEY, cert: Config.TLS_CERT };

        this.initLogging();
        this.initRoutes();

        process.on('SIGINT', () => {
            this.stop();
        });
    }

    /**
     * Run the service with the config specified in ./config/Config.ts
     */
    public async start() {
        if (!this.running) {
            logger.info('Attempting start of api-gateway.');

            //Start http server
            logger.info(`Trying to start ${Config.SSL_ENABLED ? 'https' : 'http'} server at ${Config.HOST}:${Config.PORT}.`);
            const srv = Config.SSL_ENABLED ? https.createServer(this.tlsCredentials, this.express) : http.createServer(this.express);
            this.server = srv.listen(Config.PORT, Config.HOST, (err: any) => {
                if (err) {
                    logger.error(`${Config.SSL_ENABLED ? 'Https' : 'Http'} server creation failed: `, err);
                    return process.exit(1);
                }
                return logger.info(`${Config.SSL_ENABLED ? 'Https' : 'Http'} server creation successful. Listening on host ${Config.HOST}, port ${Config.PORT}.`);
            });

            this.running = true;
        }
    }

    /**
     * Stop the service gracefully, exit hard on error
     */
    public async stop() {
        if (this.running) {
            process.removeAllListeners();
            logger.info('Attempting graceful shutdown of api-gateway.');

            try {
                //Stop http server if existing.
                if (this.server) {
                    logger.info('Trying to stop https server.');
                    const httpPromise = new Promise<void>((resolve, reject) => {
                        this.server!.close((err: any) => {
                            if (err) {
                                logger.error('Https server could not be stopped.');
                                return reject(err);
                            }
                            logger.info('Https server successfully stopped.');
                            resolve();
                        });
                    });
                    await httpPromise;
                }

                logger.info('Shutting down gracefully');
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown: ', err);
                process.exit(1);
            }
        }
    }

    /**
     * Initialize the logger for this service's logging
     */
    private initLogging() {
        logger = Winston.createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.errors({ stack: true }),
                format.splat(),
                format.json()
            ),
            defaultMeta: { service: 'api-gateway' },
            transports: [
                // Write to all logs with level 'info' and below to 'combined.log'
                // Write all logs error (and below) to 'error.log'
                new transports.File({ filename: `${Config.LOG_PATH}/error.log`, level: 'error' }),
                new transports.File({ filename: `${Config.LOG_PATH}/warn.log`, level: 'warn' }),
                new transports.File({ filename: `${Config.LOG_PATH}/combined.log` })
            ]
        });

        // If we're not in production then **ALSO** log to the 'console' with the colorized simple format.
        if (process.env.NODE_ENV !== 'production') {
            logger.add(new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.simple()
                )
            }));
        }
    }

    /**
     * Setup all the controllers for the REST api
     */
    private initRoutes(): void {
        if (this.express) {
            this.express.use(timeout(`${Config.TIMEOUT}ms`));

            this.express.use("*", function (req, res, next) {
                console.log('request', req.protocol, req.hostname, req.originalUrl);
                // Add CORS headers to each request coming directly from the auth service
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', '*');
                res.header('Access-Control-Allow-Headers', '*');
                res.header('Access-Control-Allow-Credentials', 'true');
                // Make www-authenticate header available to the frontend to detect when to refresh the token
                res.header('Access-Control-Expose-Headers', 'WWW-Authenticate');
                if ('OPTIONS' === req.method) {
                    //respond with 200
                    res.sendStatus(200);
                } else {
                    next();
                }
            });

            // Set our api routes
            this.express.use(bodyParser.json());
            this.express.use(bodyParser.urlencoded({ extended: false }));
            this.express.use(bodyParser.raw());

            this.express.use(stopOnTimeout);
            this.express.use(targetLookup);
            this.express.use(stopOnTimeout);
            this.express.use(externalAuth);
            this.express.use(stopOnTimeout);
            this.express.use(redirect);
        } else {
            logger.error('Express is undefined. Exiting.')
        }
    }

}

// ------------------------ Main ------------------------
Service.Instance.start();