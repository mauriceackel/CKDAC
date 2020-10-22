import { IDocumentToObjectOptions } from "./IDocumentToObjectOptions";

export interface IJSONifyable {
    toJSON(options?: IDocumentToObjectOptions): any
}