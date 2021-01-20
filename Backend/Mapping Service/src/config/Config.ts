import fs from 'fs';

export const PORT: number = Number.parseInt(process.env.PORT || "8080");
export const HOST: string = process.env.HOST || "localhost";

export const DB_URL: string = process.env.DB_URL || "";
export const DB_USER: string = process.env.DB_USER || "";
export const DB_PW: string = process.env.DB_PW || "";

export const ACCESS_TOKEN_PUB: Buffer = fs.readFileSync(`${process.env.ACCESS_TOKEN_PATH || '/etc/secrets-volume/access-token'}/public-key`);

export const API_KEY = process.env.API_KEY || "";

export const LOG_PATH: string = process.env.LOG_PATH || "";

//All REST API endpoints are specified here
export const mappingEndpoint: string = "mappings";
export const generateEndpoint: string = `${mappingEndpoint}/generate`;
