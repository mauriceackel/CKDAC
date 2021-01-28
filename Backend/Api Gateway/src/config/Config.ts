import fs from 'fs'
import { Mapping } from '../services/RoutingService';

export const SSL_ENABLED: boolean = process.env.SSL_ENABLED === "true";

export const PORT: number = Number.parseInt(process.env.PORT || (SSL_ENABLED ? "8443" : "8080"));
export const HOST: string = process.env.HOST || "localhost";

export const TLS_KEY: string = SSL_ENABLED ? fs.readFileSync(`${process.env.TLS_SECRETS_PATH || '/etc/secrets-volume/tls-secret'}/key`, 'utf8') : '';
export const TLS_CERT: string = SSL_ENABLED ? fs.readFileSync(`${process.env.TLS_SECRETS_PATH || '/etc/secrets-volume/tls-secret'}/cert`, 'utf8') : '';

export const MAPPINGS: Mapping[] = process.env.MAPPINGS_PATH ? JSON.parse(fs.readFileSync(process.env.MAPPINGS_PATH, 'utf8')) : [];

export const TIMEOUT: number = Number.parseInt(process.env.TIMEOUT || "30000"); //30 sec
export const CORS_ORIGIN: Array<string> = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(e => e.trim()) : [];

export const LOG_PATH: string = process.env.LOG_PATH || "";

export const AUTH_SERVICE_URL: string = process.env.AUTH_SERVICE_URL || "localhost:8080";
