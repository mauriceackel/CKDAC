import { Schema, Document, Model, model, Query } from "mongoose";

/**
 * The user interface, which only contains the fields of a user.
 */
export interface IActivity {
    name: string,
    method: string,
    url: string,
    accessLevel: number
}

/**
 * The usermodel interface, which extends the document and the IUser interface. Only add method stubs of the schema here.
 */
export interface IActivityModel extends Model<IActivity & Document> {
}

const ActivitySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    //The http method or * if it matches all
    method: {
        type: String,
        required: true
    },
    //A regex that is used to test the route part of the url (/abc?q=1) against. The following will match everything: ^.*$
    url: {
        type: String,
        required: true
    },
    //Adds an  additional level to the activity. In general, the higher the number the higher the permissions with Number.MAX_VALUE (1.7976931348623157e+308) being the highest.
    accessLevel: {
        type: Number,
        default: 0
    }
});

export const Activity = model<IActivity & Document, IActivityModel>('Activity', ActivitySchema);