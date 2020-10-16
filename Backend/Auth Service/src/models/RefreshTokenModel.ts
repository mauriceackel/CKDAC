import { Schema, Document, Model, model } from "mongoose";
import crypto from 'crypto';
import { REFRESH_TOKEN_TTL } from "../config/Config";

/**
 * The user interface, which only contains the fields of a user.
 */
export interface IRefreshToken {
    userId: string,
    token: string,
    expiryDate: Date
    isValid(): boolean;
    renew(): Promise<void>;
}

/**
 * The usermodel interface, which extends the document and the IUser interface. Only add method stubs of the schema here.
 */
export interface IRefreshTokenModel extends Model<IRefreshToken & Document> {
    createTokenValue(): string;
}

const RefreshTokenSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    token: {
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

RefreshTokenSchema.methods.isValid = function (this: IRefreshToken): boolean {
    return this.expiryDate > new Date();
}

RefreshTokenSchema.methods.renew = async function (this: IRefreshToken & Document): Promise<void> {
    //Set new token and update the lifetime
    this.token = RefreshToken.createTokenValue();
    this.expiryDate = new Date(Date.now() + REFRESH_TOKEN_TTL);
    await this.save();
}

RefreshTokenSchema.statics.createTokenValue = function (): string {
    return crypto.randomBytes(128).toString('base64');
}

export const RefreshToken = model<IRefreshToken & Document, IRefreshTokenModel>('RefreshToken', RefreshTokenSchema);