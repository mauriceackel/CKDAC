import fs from 'fs'

export const PORT: number = Number.parseInt(process.env.PORT || "8080");
export const HOST: string = process.env.HOST || "localhost";

export const DB_URL: string = process.env.DB_URL || "";
export const DB_USER: string = process.env.DB_USER || "";
export const DB_PW: string = process.env.DB_PW || "";

export const ACCESS_TOKEN_PUB: Buffer = fs.readFileSync(`${process.env.ACCESS_TOKEN_PATH || '/etc/secrets-volume/access-token'}/public-key`);
export const ACCESS_TOKEN_PRIV: Buffer = fs.readFileSync(`${process.env.ACCESS_TOKEN_PATH || '/etc/secrets-volume/access-token'}/private-key`);

export const AUTH_DETAILS_TOKEN_TTL: number = Number.parseInt(process.env.AUTH_DETAILS_TOKEN_TTL || "30000"); //30 sec
export const PW_TOKEN_TTL: number = Number.parseInt(process.env.PW_TOKEN_TTL || "120000"); //2 min
export const ACCESS_TOKEN_TTL: number = Number.parseInt(process.env.ACCESS_TOKEN_TTL || "300000"); //5 min
export const REFRESH_TOKEN_TTL: number = Number.parseInt(process.env.REFRESH_TOKEN_TTL || "3600000"); //1 h

export const API_KEY = process.env.API_KEY || "";

export const CORS_ORIGIN: Array<string> = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(e => e.trim()) : [];

export const LOG_PATH: string = process.env.LOG_PATH || "";

export const apiHost: string = process.env.GATEWAY_INT_URL || ""
export const authHost: string = process.env.AUTH_HOSTNAME || apiHost;
export const usersEndpoint: string = `${apiHost}/users`;
export const validationEndpoint: string = `${apiHost}/validate`;