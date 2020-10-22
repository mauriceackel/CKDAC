import { Schema, Document, Model, model } from "mongoose";
import "./PermissionModel";
import { IPermission } from "./PermissionModel";

/**
 * The user interface, which only contains the fields of a user.
 */
export interface IRole {
    name: string,
    users: Array<Schema.Types.ObjectId>,
    services: Array<string>,
    permissions: Array<IPermission>,
    claims: string[]
}

/**
 * The usermodel interface, which extends the document and the IUser interface. Only add method stubs of the schema here.
 */
export interface IRoleModel extends Model<IRole & Document> {
}

const RoleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    users: {
        type: [{type: Schema.Types.ObjectId}],
        default: [],
    },
    services: {
        type: [{type: String}],
        default: [],
    },
    permissions: {
        type: [{type: Schema.Types.ObjectId, ref: 'Permission'}],
        default: [],
        autopopulate: true
    },
    claims: {
        type: [{type: String}],
        default: [],
    },
});
RoleSchema.plugin(require('mongoose-autopopulate'));

export const Role = model<IRole & Document, IRoleModel>('Role', RoleSchema);