import { Schema, Document, Model, model } from "mongoose";

/**
 * The user interface, which only contains the fields of a user.
 */
export interface ICounter {
    key: string,
    value: number
    next() : Promise<number>;
}

/**
 * The usermodel interface, which extends the document and the IUser interface. Only add method stubs of the schema here.
 */
export interface ICounterModel extends Model<ICounter & Document> {
}

const CounterSchema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: Number,
        default: 0
    },
});

CounterSchema.methods.next = async function (this: ICounter & Document) {
    return new Promise<number>((resolve, reject) => {
        this.update({
            $inc:{value:1}
        },(err : any) => {
            if(err) {
                return reject(err);
            }
            return resolve(this.value);
        });
    });
}

export const Counter = model<ICounter & Document, ICounterModel>('Counter', CounterSchema);