import { IAsyncApiOperation, IOpenApiOperation } from "../models/OperationModel";
import { getMessageSchema } from "./asyncapi-parser";
import { getResponseSchema, getRequestSchema } from "./swagger-parser";

export async function getSourceResponseBody(source: IOpenApiOperation) {
    const { api: srcApi, ...srcOperation } = source;
    return {
        [`${srcApi.id}_${srcOperation.operationId}_${srcOperation.responseId}`]: await getResponseSchema(source)
    }
}

export async function getTargetRequestBodies(targets: { [key: string]: IOpenApiOperation }) {
    const schemaPromises = Object.entries(targets || {}).map(async ([key, value]) => ({ key, schema: await getRequestSchema(value, true) }));
    return (await Promise.all(schemaPromises)).reduce((obj, { key, schema }) => ({ ...obj, [key]: schema }), {});
}

export async function getSourceMessageBody(source: IAsyncApiOperation) {
    const { api: srcApi, ...srcOperation } = source;
    return {
        [`${srcApi.id}_${srcOperation.operationId}`]: await getMessageSchema(source)
    }
}

export async function getTargetMessageBodies(targets: { [key: string]: IAsyncApiOperation }) {
    const schemaPromises = Object.entries(targets || {}).map(async ([key, value]) => ({ key, schema: await getMessageSchema(value, true) }));
    return (await Promise.all(schemaPromises)).reduce((obj, { key, schema }) => ({ ...obj, [key]: schema }), {});
}