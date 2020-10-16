import { DocumentToObjectOptions } from "mongoose";

export interface IDocumentToObjectOptions extends DocumentToObjectOptions {
    userId?: string,
    accessLevel: number;
}