import fs from 'fs';

export const PORT: number = Number.parseInt(process.env.PORT || "8080");
export const HOST: string = process.env.HOST || "localhost";

export const DB_URL: string = process.env.DB_URL || "mongodb://127.0.0.1/api-service";
export const DB_USER: string = process.env.DB_USER || "api-service";
export const DB_PW: string = process.env.DB_PW || "rnqw+s0U1XHAch2FQlZki6ArQf6r4btpEmNlVdmJ80eFirLJ+jWbLUMq4/9o0uDcoa7HTETe98kJFsSCnMHxuCYBt6HcS67G7/5jyrCei3FgmYvLqzFYoyUTo52p3ExwzfWqDQuuIkqi9rizdm7bn8tWTc3QuhqH2dfXQcrwlglpg/tPlvrKBYSD3dmpvdC1OVr5s3Jg5cPhG8IGy7OaYGfhIAgvA91qp8j+Dv/BN80sog+/BZJmy7nBIdgS4vTn";

export const ACCESS_TOKEN_PUB: Buffer = fs.readFileSync('/etc/secrets-volume/access-token/public-key');

export const API_KEY = process.env.API_KEY || "";

export const LOG_PATH: string = process.env.LOG_PATH || "";

//All REST API endpoints are specified here
export const apiEndpoint: string = "apis";
