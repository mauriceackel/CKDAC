import fs from 'fs'

export const PORT: number = Number.parseInt(process.env.PORT || "8443");
export const HOST: string = process.env.HOST || "localhost";

export const TLS_KEY: string = fs.readFileSync(`${process.env.TLS_SECRETS_PATH || '/etc/secrets-volume/tls-secret'}/key`, 'utf8');
export const TLS_CERT: string = fs.readFileSync(`${process.env.TLS_SECRETS_PATH || '/etc/secrets-volume/tls-secret'}/cert`, 'utf8');

export const TIMEOUT: number = Number.parseInt(process.env.TIMEOUT || "30000"); //30 sec
export const CORS_ORIGIN: Array<string> = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(e => e.trim()) : [];

export const LOG_PATH: string = process.env.LOG_PATH || "";

export const AUTH_SERVICE_URL: string = process.env.AUTH_SERVICE_URL || "localhost:8080";
