import { Schema, Document, Model, model, Query } from "mongoose";

/**
 * The user interface, which only contains the fields of a user.
 */
export interface IActivity {
    name: string,
    method: string,
    url: string,
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
});

export const Activity = model<IActivity & Document, IActivityModel>('Activity', ActivitySchema);