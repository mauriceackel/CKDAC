import { Document, HookNextFunction, model, Model, Schema } from "mongoose";
import { IDocumentToObjectOptions } from "../utils/interfaces/IDocumentToObjectOptions";
import { ApiType } from "./ApiModel";
import crypto from 'crypto';
import { IJSONifyable } from "../utils/interfaces/IJSONifyable";

export enum MappingType {
    TRANSFORMATION,
    AUTO,
    REVERSE
}

export enum MappingDirection {
    INPUT, OUTPUT
}

export interface IMapping extends IJSONifyable {
    id: string
    createdBy: string
    apiType: ApiType
    type: MappingType
    sourceId: string
    targetIds: string[]
}

export interface IMappingModel extends Model<IMapping & Document> {
}

const MappingSchema = new Schema({
    createdBy: {
        type: String,
        required: true,
    },
    apiType: {
        type: ApiType,
        required: true,
    },
    type: {
        type: MappingType,
        required: true
    },
    sourceId: {
        type: String,
        required: true
    },
    targetIds: {
        type: [String],
        required: true
    },
    checksum: {
        type: String,
        unique: true,
        select: false,
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
        transform: (mapping: IMapping, result: any, options: IDocumentToObjectOptions) => {
            delete result._id;
            delete result.__v;

            if (options.claims.filter(c => ["admin", "owner"].includes(c)).length === 0) {
                delete result.createdBy;
            }
        }
    }
});

function buildOpenApiChecksum(this: Document & IMapping, next: HookNextFunction) {
    const mapping = this as unknown as IOpenApiMapping & { checksum: string };
    mapping.checksum = crypto.createHash('sha1').update(mapping.requestMapping + mapping.responseMapping).digest().toString('hex');
    next();
}

function buildAsyncApiChecksum(this: Document & IMapping, next: HookNextFunction) {
    const mapping = this as unknown as IAsyncApiMapping & { checksum: string };
    mapping.checksum = crypto.createHash('sha1').update(Object.values(mapping.messageMappings).join('')).digest().toString('hex');
    next();
}

export const Mapping = model<IMapping & Document, IMappingModel>('Mapping', MappingSchema);


/// -------- AsyncApi Mapping ---------- ///
export interface IAsyncApiMapping extends IMapping {
    direction: MappingDirection //If input, source & targets are subscribers. If output, providers.
    // The key is the id of the target
    topics: {
        source: string,
        targets: { [targetId: string]: string }
    }
    servers: {
        source: string,
        targets: { [targetId: string]: string }
    }
    messageMappings: { [key: string]: string } //JSONata mappings
}

const AsyncApiMappingSchema = new Schema({
    direction: {
        type: MappingDirection,
        required: true
    },
    topics: {
        source: {
            type: String,
            required: true
        },
        targets: {
            type: Schema.Types.Mixed,
            required: true
        }
    },
    servers: {
        source: {
            type: String,
            required: true
        },
        targets: {
            type: Schema.Types.Mixed,
            required: true
        }
    },
    messageMappings: {
        type: Schema.Types.Mixed,
        required: true
    } //JSONata mappings
});
AsyncApiMappingSchema.pre('validate', buildAsyncApiChecksum);
export const AsyncApiMapping = Mapping.discriminator<IAsyncApiMapping & Document>('AsyncApiMapping', AsyncApiMappingSchema);


/// -------- OpenApi Mapping ---------- ///
export interface IOpenApiMapping extends IMapping {
    requestMapping: string //JSONata mapping
    responseMapping: string //JSONata mapping
}

const OpenApiMappingSchema = new Schema({
    requestMapping: {
        type: String,
        required: true
    },
    responseMapping: {
        type: String,
        required: true
    }
});
OpenApiMappingSchema.pre('validate', buildOpenApiChecksum);
export const OpenApiMapping = Mapping.discriminator<IOpenApiMapping & Document>('OpenApiMapping', OpenApiMappingSchema);
