import * as AsyncApiParser from '@asyncapi/parser';
import { Channel, PublishOperation, SubscribeOperation } from '@asyncapi/parser';
import { IApi } from '../models/ApiModel';
import { IAsyncApiOperation } from '../models/OperationModel';

export async function getOperation(api: IApi, operationId: string): Promise<{ url: string, channel: Channel, operation: PublishOperation | SubscribeOperation } | undefined> {
  const apiObject = await AsyncApiParser.parse(api.apiSpec);

  //Iterate all channels
  for (const url of apiObject.channelNames()) {
    const channel = apiObject.channel(url);

    if (channel.hasPublish()) {
      const operation = channel.publish();

      if (operation.id() === operationId) {
        return { url, channel, operation };
      }
    }

    if (channel.hasSubscribe()) {
      const operation = channel.subscribe();

      if (operation.id() === operationId) {
        return { url, channel, operation };
      }
    }
  }

  return undefined;
}

export async function getMessageSchema(searchOperation: IAsyncApiOperation, ignoreOptional: boolean = false) {
  const op = await getOperation(searchOperation.api, searchOperation.operationId);

  if (!op) {
    return undefined;
  }

  const message = op.operation.message();

  try {
    const result: { parameters?: any, headers?: any, payload?: any } = {};

    const parameters = Object.entries(op.channel.parameters()).reduce((params, [key, value]) => ({ ...params, [key]: removeTypes(flattenSchema(value.json())) }), {});
    if (Object.keys(parameters).length > 0) {
      result.parameters = parameters;
    }

    const headerJSON = message.headers()?.json();
    if(headerJSON !== undefined) {
      const headers = removeTypes(flattenSchema(headerJSON));
      if (Object.keys(headers).length > 0) {
        result.headers = headers;
      }
    }

    const payloadJSON = message.payload()?.json();
    if(payloadJSON !== undefined) {
      const payload = removeTypes(flattenSchema(payloadJSON));
      if (Object.keys(payload).length > 0) {
        result.payload = payload;
      }
    }

    return result;
  } catch (err) {
    console.log(message, err);
  }
}

function removeTypes(schema: any): any {
  if (schema["type"] == "object") {
    for (const key in schema.properties) {
      schema.properties[key] = removeTypes(schema.properties[key])
    }
    return schema.properties || {};
  } else if (schema["type"] == "array") {
    return [removeTypes(schema.items)];
  } else {
    return schema["type"];
  }
}

function flattenSchema(schema: any) {
  if (schema["allOf"] != undefined) {
    let combination: any = {
      type: "object",
      properties: {}
    }
    for (const child of schema["allOf"]) {
      combination.properties = {
        ...combination.properties,
        ...flattenSchema(child).properties
      }
    }
    return combination;
  } else {
    return schema;
  }
}
