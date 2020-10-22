import { IJSONifyable } from "./IJSONifyable";
import { Document as MongooseDoc } from "mongoose";

export type Document = MongooseDoc & IJSONifyable;