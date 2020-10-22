import { DocumentToObjectOptions } from "mongoose";

export interface IDocumentToObjectOptions extends DocumentToObjectOptions {
    claims: string[]
}