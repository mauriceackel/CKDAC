import { Schema, Document, Model, model, DocumentToObjectOptions } from "mongoose";
import validator from 'validator';
import crypto from 'crypto';
import * as Config from '../config/Config';
import { IDocumentToObjectOptions } from "../utils/interfaces/IDocumentToObjectOptions";

export enum UserType {
    STANDARD
}

/**
 * The user interface, which only contains the fields of a user.
 */
export interface IUser {
    id: string
    password?: string,
    email: string,
    firstname: string,
    lastname: string,
    displayname?: string,
    type: UserType,
    validatePassword(password: string): boolean;
    toJSON(options?: IDocumentToObjectOptions): any;
}

/**
 * The usermodel interface, which extends the document and the IUser interface. Only add method stubs of the schema here.
 */
export interface IUserModel extends Model<IUser & Document> {
}

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: (value: string) => {
            return validator.isEmail(value);
        }
    },
    password: {
        type: String,
        required: true,
        select: false,
        validate: (value: string) => {
            //Check min pw length. More constraints could be added
            return value.length >= Config.MIN_PW_LEN;
        },
        set: function (password: string) {
            // generate a salt
            let salt = crypto.randomBytes(16).toString('hex');
            // hashing user's salt and password with 1000 iterations, 64 length and sha512 digest 
            let hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
            return hash + "/" + salt;
        }
    },
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    type: {
        type: UserType,
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
        transform: (user: IUser, result: any, options: IDocumentToObjectOptions) => {
            //Fields always deleted
            delete result.password;
            delete result._id;
            delete result.__v;

            //Fields only deleted if not enough permissions
            if (options.accessLevel < 1000 && options.userId != user.id) {
                delete result.email;
            }
        }
    }
});

UserSchema.methods.validatePassword = function (this: IUser, password: string): boolean {
    if (!this.password) return false;
    let storedParts = this.password.split("/");
    let pwHash = storedParts[0];
    let pwSalt = storedParts[1];

    const testHash = crypto.pbkdf2Sync(password, pwSalt, 1000, 64, `sha512`).toString(`hex`);
    return pwHash === testHash;
}

UserSchema.virtual('displayname').get(function (this: IUser): string {
    return `${this.firstname} ${this.lastname}`;
});

export const User = model<IUser & Document, IUserModel>('User', UserSchema);