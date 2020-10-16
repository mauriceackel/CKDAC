import * as AsyncApiParser from '@asyncapi/parser';
import { IApi } from '../models/api.model';
import { IAsyncApiInterface } from '../models/api-interface.model';
import { Channel, PublishOperation, SubscribeOperation } from '@asyncapi/parser';

export async function getServer(api: IApi) {
  const apiObject = await AsyncApiParser.parse(api.apiSpec);

  const server = Object.values(apiObject.servers())[0];
  const url = Object.entries(server.variables() || []).reduce((url, [varname, value]) => url.replace(new RegExp(`{${varname}}`, 'g'), value.defaultValue()), server.url());
  return url;
}

export async function getRequestUrls(ifaces: { [key: string]: IAsyncApiInterface }, paramValues: { [key: string]: { parameters: { [key: string]: string } } } = {}) {
  return Promise.all(Object.entries(ifaces).map(([key, value]) => getRequestUrl(value, paramValues[key]?.parameters)));
}

export async function getRequestUrl(iface: IAsyncApiInterface, paramValues: { [key: string]: string } = {}) {
  const server = await getServer(iface.api);
  const { url, channel, operation } = await getOperation(iface.api, iface.operationId);

  //Get all required parameters
  let parameters: string[] = [];
  if (channel.hasParameters()) {
    parameters = Object.keys(channel.parameters());
  }

  const urlWithParams = parameters.reduce((currUrl, currParam) => currUrl.replace(new RegExp(`{${currParam}}`, 'g'), paramValues[currParam] || ''), url);

  return `${server}${urlWithParams}`;
}

export async function getOperationTemplates(api: IApi, publish: boolean) {
  const operationTemplates: IAsyncApiOperationTemplate[] = [];

  const apiObject = await AsyncApiParser.parse(api.apiSpec);

  for (const url of apiObject.channelNames()) {
    const channel = apiObject.channel(url);

    //This is inverted, as publishing a message from the client means that the channel has a subscribe operation for it and vice versa
    if (!publish && channel.hasPublish()) {
      const operation = channel.publish();
      operationTemplates.push({ operationId: operation.id(), url });
    }

    if (publish && channel.hasSubscribe()) {
      const operation = channel.subscribe();
      operationTemplates.push({ operationId: operation.id(), url });
    }
  }

  return {servers: Object.keys(apiObject.servers()), operationTemplates};
}

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

export async function getMessageSchema(api: IApi, searchOperation: IAsyncApiOperation, ignoreOptional: boolean = false) {
  const op = await getOperation(api, searchOperation.operationId);

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

function removeTypes(schema: any) {
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

export interface IAsyncApiOperationTemplate {
  operationId: string,
  url: string
}

export interface IAsyncApiOperation {
  operationId: string
}
