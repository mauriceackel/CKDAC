import Express, { Application } from 'express';
import bodyParser from 'body-parser';
import * as Config from './config/Config';
import http from 'http';
import Winston, { format, transports, Logger } from 'winston';
import axios from 'axios';
import { ErrorResponse } from './utils/responses/ApiResponse';
import AdapterController from './controller/AdapterController';
import FileController from './controller/FileController';
import { getAuthDetails } from './middleware/Auth';

export var logger: Logger;

export class Service {

    private static instance: Service;
    public static get Instance(): Service {
        return this.instance || (this.instance = new this());
    }

    private httpServer?: http.Server;
    private express?: Application;

    private running: boolean;

    private constructor() {
        this.running = false;
        this.express = Express();

        this.initLogging();
        this.initAuth();
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
            logger.info('Attempting start of adapter-service.');

            //Start http server
            logger.info(`Trying to start http server at ${Config.HOST}:${Config.PORT}.`);
            this.httpServer = http.createServer(this.express).listen(Config.PORT, Config.HOST, () => {
                return logger.info(`Http server creation successful. Listening on host ${Config.HOST}, port ${Config.PORT}.`);
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
            logger.info('Attempting graceful shutdown of adapter-service.');

            try {
                //Stop http server if existing.
                if (this.httpServer) {
                    logger.info('Trying to stop http server.');
                    let httpPromise = new Promise<void>((resolve, reject) => {
                        this.httpServer!.close((err: any) => {
                            if (err) {
                                logger.error('Http server could not be stopped.');
                                return reject(err);
                            }
                            logger.info('Http server successfully stopped.');
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
    public initLogging() {
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
            defaultMeta: { service: 'adapter-service' },
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
            this.express.use("*", function (req, res, next) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', '*');
                res.header('Access-Control-Allow-Headers', '*');
                res.header('Access-Control-Allow-Credentials', 'true');
                if ('OPTIONS' === req.method) {
                    //respond with 204
                    res.send(204);
                } else {
                    next();
                }
            });
            // Set our api routes
            this.express.use(bodyParser.json());
            this.express.use(bodyParser.urlencoded({ extended: false }));
            this.express.use(bodyParser.raw());

            //Register middleware
            this.express.use(getAuthDetails);

            //Register controllers
            this.express.use(`/${Config.adapterEndpoint}`, AdapterController);
            this.express.use(`/${Config.fileEndpoint}`, FileController);

            // Catch all other routes and return the index file
            this.express.all('*', (req, res) => {
                let response = new ErrorResponse(404);
                res.status(response.Code).json(response);
            });
        } else {
            logger.error('Express is undefined. Exiting.')
        }
    }

    /**
     * Sets up authentication for api calls FROM this service
     */
    private initAuth(): void {
        axios.interceptors.request.use(function (config) {
            config.headers["authorization"] = `ApiKey ${Config.API_KEY}`;
            return config;
        }, function (error) {
            return Promise.reject(error);
        });
    }

}

// ------------------------ Main ------------------------
Service.Instance.start();