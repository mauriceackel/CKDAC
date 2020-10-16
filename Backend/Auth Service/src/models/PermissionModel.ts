import { Schema, Document, Model, model } from "mongoose";
import "./ActivityModel";
import { IActivity } from "./ActivityModel";

/**
 * The user interface, which only contains the fields of a user.
 */
export interface IPermission {
    name: string,
    activities: Array<IActivity>
}

/**
 * The usermodel interface, which extends the document and the IUser interface. Only add method stubs of the schema here.
 */
export interface IPermissionModel extends Model<IPermission & Document> {
}

const PermissionSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    activities: {
        type: [{type: Schema.Types.ObjectId, ref: 'Activity'}],
        default: [],
        autopopulate: true
    }
});
PermissionSchema.plugin(require('mongoose-autopopulate'));

export const Permission = model<IPermission & Document, IPermissionModel>('Permission', PermissionSchema);