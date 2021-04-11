import AsyncApiParser, {
  AsyncAPIDocument,
  Channel,
  PublishOperation,
  SubscribeOperation,
} from '@asyncapi/parser';
import { AsyncApiModel } from 'models/ApiModel';
import { Schema, removeTypes, flattenSchema } from './schemaHelpers';

// #region Types & constants
export type AsyncApiOperation = {
  api: AsyncApiModel;
  operationId: string;
};

// #endregion

export async function parseApiSpec(apiSpec: string): Promise<AsyncAPIDocument> {
  return AsyncApiParser.parse(apiSpec);
}

// #region Get operations details
function getOperation(
  apiObject: AsyncAPIDocument,
  operationId: string,
  mode: 'publish' | 'subscribe' | 'any',
):
  | {
      pathUrl: string;
      channel: Channel;
      operation: PublishOperation | SubscribeOperation;
    }
  | undefined {
  const paths = apiObject.channelNames();

  const operations = paths
    .map((path) => ({
      path,
      channel: apiObject.channel(path),
    }))
    .flatMap(({ path, channel }) => {
      const result = [];
      if (mode !== 'subscribe' && channel.hasPublish()) {
        result.push({
          pathUrl: path,
          channel,
          operation: channel.publish(),
        });
      }
      if (mode !== 'publish' && channel.hasSubscribe()) {
        result.push({
          pathUrl: path,
          channel,
          operation: channel.subscribe(),
        });
      }

      return result;
    });

  return operations.find(({ operation }) => operation.id() === operationId);
}

export function getOperationIds(
  apiObject: AsyncApiParser.AsyncAPIDocument,
  mode: 'publish' | 'subscribe' | 'any',
): string[] {
  return apiObject
    .channelNames()
    .map((path) => apiObject.channel(path))
    .flatMap((channel) => {
      const result = [];
      if (mode !== 'subscribe' && channel.hasPublish()) {
        result.push(channel.publish());
      }

      if (mode !== 'publish' && channel.hasSubscribe()) {
        result.push(channel.subscribe());
      }

      return result;
    })
    .map((operation) => operation.id());
}
// #endregion

// #region Get server details
export function getServers(apiObject: AsyncAPIDocument): string[] | undefined {
  const servers = Object.values(apiObject.servers());

  if (servers.length === 0) {
    return undefined;
  }

  return servers.map((server) => {
    return Object.entries(server.variables() || []).reduce(
      (url, [varname, value]) =>
        url.replace(new RegExp(`{${varname}}`, 'g'), value.defaultValue()),
      server.url(),
    );
  });
}
// #endregion

// #region Message Schema
export function getMessageSchema(
  apiObject: AsyncAPIDocument,
  operationId: string,
): Schema | undefined {
  const result = getOperation(apiObject, operationId, 'any');

  if (result === undefined) {
    return undefined;
  }

  const { channel, operation } = result;

  const message = operation.message();

  const parameters = Object.entries(channel.parameters()).reduce(
    (params, [paramName, parameter]) => ({
      ...params,
      [paramName]: removeTypes(flattenSchema(parameter.json())),
    }),
    {},
  );

  const headerJSON = message.headers()?.json();
  const headers = headerJSON ? removeTypes(flattenSchema(headerJSON)) : {};

  const payloadJSON = message.payload()?.json();
  const payload = payloadJSON ? removeTypes(flattenSchema(payloadJSON)) : {};

  return {
    ...(channel.hasParameters() ? { parameters } : null),
    ...(Object.keys(headers).length > 0 ? { headers } : null),
    ...(Object.keys(payload).length > 0 ? { payload } : null),
  };
}
// #endregion

// #region Request URL
export function getRequestUrl(
  apiObject: AsyncAPIDocument,
  operationId: string,
  paramValues: Record<string, string> = {},
): string | undefined {
  const servers = getServers(apiObject);
  const operationResult = getOperation(apiObject, operationId, 'any');
  console.log(servers, apiObject, operationId, operationResult);

  if (!servers || servers.length === 0 || !operationResult) {
    return undefined;
  }

  const { pathUrl, channel } = operationResult;
  const server = servers[0];

  // Get all required parameters
  const parameters = channel.hasParameters()
    ? Object.keys(channel.parameters())
    : [];

  const urlWithParams = parameters.reduce(
    (currUrl, currParam) =>
      currUrl.replace(
        new RegExp(`{${currParam}}`, 'g'),
        paramValues[currParam] || '',
      ),
    pathUrl,
  );

  return `${server}${urlWithParams}`;
}
// #endregion
