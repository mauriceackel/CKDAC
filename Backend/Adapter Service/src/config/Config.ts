import fs from 'fs';

export const PORT: number = Number.parseInt(process.env.PORT || "8080");
export const HOST: string = process.env.HOST || "localhost";

export const ACCESS_TOKEN_PUB: Buffer = fs.readFileSync(`${process.env.ACCESS_TOKEN_PATH || '/etc/secrets-volume/access-token'}/public-key`);

export const API_KEY = process.env.API_KEY || "";

export const LOG_PATH: string = process.env.LOG_PATH || "";

export const STORAGE_PATH: string = process.env.STORAGE_PATH || "/tmp/adapter-generator";

//All REST API endpoints are specified here
export const adapterEndpoint: string = "generate";
export const fileEndpoint: string = "download";

export const apiHost: string = process.env.GATEWAY_INT_URL || "";
export const apiEndpoint: string = `${apiHost}/apis`;