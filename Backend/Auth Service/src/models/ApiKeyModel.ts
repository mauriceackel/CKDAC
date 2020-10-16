import { Schema, Document, Model, model } from "mongoose";
import crypto from 'crypto';
import { REFRESH_TOKEN_TTL } from "../config/Config";

/**
 * The user interface, which only contains the fields of a user.
 */
export interface IApiKey {
    name: string,
    key: string,
    expiryDate: Date,
    isValid(): boolean
}

/**
 * The usermodel interface, which extends the document and the IUser interface. Only add method stubs of the schema here.
 */
export interface IApiKeyModel extends Model<IApiKey & Document> {
}

const ApiKeySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
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
        timestamps: true
    });

ApiKeySchema.methods.isValid = function (this: IApiKey): boolean {
    return this.expiryDate > new Date();
}

export const ApiKey = model<IApiKey & Document, IApiKeyModel>('ApiKey', ApiKeySchema);