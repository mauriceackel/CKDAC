import { model, Model, Schema } from "mongoose";
import { Document } from "../utils/interfaces/Document";
import { IDocumentToObjectOptions } from "../utils/interfaces/IDocumentToObjectOptions";

export enum ApiType {
    OPEN_API, ASYNC_API
}

export interface IApi {
    id: string
    createdBy: string
    name: string
    type: ApiType
    apiSpec: string
    metadata: {
        company?: string
        keywords?: string
    }
}

export interface IApiModel extends Model<IApi & Document> {
}

const ApiSchema = new Schema({
    createdBy: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    metadata: {
        company: {
            type: String,
            required: false
        },
        keywords: {
            type: String,
            required: false
        }
    },
    type: {
        type: ApiType,
        required: true
    },
    apiSpec: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        select: false
    },
    updatedAt: {
        type: Date,
        select: false
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (api: IApi, result: any, options: IDocumentToObjectOptions) => {
            delete result._id;
            delete result.__v;

            if (options.claims.filter(c => ["admin", "owner"].includes(c)).length === 0) {
                delete result.createdBy;
            }
        }
    }
});

export const Api = model<IApi & Document, IApiModel>('Api', ApiSchema);