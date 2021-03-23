import { logger } from "../../Service";
import { IAsyncApiMapping } from "../../models/MappingModel";
import { STORAGE_PATH } from "../../config/Config";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import * as ApiService from "../ApiService";
import Zip from "adm-zip";
import AsyncApiParser from "@asyncapi/parser";
import { escapeQuote, stringifyedToJsonata } from "../../utils/jsonata-helpers";
import { AdapterType } from "../../utils/enums/AdapterTypes";
import { IApi } from "../../models/ApiModel";
const AsyncApiGenerator = require("@asyncapi/generator");

type OperationData = {
  api: IApi;
  apiId: string;
  operationId: string;
  topic: string;
  server: string;
}

export async function createAdapter(
  adapterType: AdapterType,
  mapping: IAsyncApiMapping,
  userId: string
): Promise<string> {
  logger.info(`Trying to create adapter for type: ${adapterType}`);

  const adapterTypeKeys: string[] = Object.keys(AdapterType);
  const adapterTypes: AdapterType[] = adapterTypeKeys.map(
    (k) => AdapterType[k as keyof typeof AdapterType]
  );
  if (!adapterTypes.includes(adapterType)) {
    throw new Error("Unkown adapter type");
  }

  // Create preliminary operations
  const sourceOperationPromise = new Promise<OperationData>(async (resolve, reject) => {
    const [sourceApiId, sourceOperationId] = mapping.sourceId.split("_");

    const api = await ApiService.getApiById(sourceApiId);
    const operationInfo = await getOperationInfo(api.apiSpec, sourceOperationId); 

    if(operationInfo === undefined) {
      reject(new Error(`Unknown operation info for ${sourceOperationId}`));
      return;
    }

    const sourceOperation = {
      api,
      apiId: sourceApiId,
      operationId: sourceOperationId,
      topic: operationInfo.url,
      server: operationInfo.server,
    };

    resolve(sourceOperation);
  });

  const targetOperationPromises: Promise<OperationData>[] = mapping.targetIds.map(async (id) => {
    const [targetApiId, targetOperationId] = id.split("_");

    const api = await ApiService.getApiById(targetApiId);
    const operationInfo = await getOperationInfo(api.apiSpec, targetOperationId);

    if(operationInfo === undefined) {
      throw new Error(`Unknown operation info for ${targetOperationId}`)
    }

    return {
      api: api,
      apiId: targetApiId,
      operationId: targetOperationId,
      topic: operationInfo.url,
      server: operationInfo.server,
    };
  });


  const [sourceOperation, ...targetOperations] = await Promise.all([
    sourceOperationPromise,
    ...targetOperationPromises
  ]);

  const fileId = uuidv4();
  const filePath = `${STORAGE_PATH}/${userId}/${fileId}`;

  logger.info(`Writing specs`);
  fs.mkdirSync(filePath, { recursive: true });

  fs.mkdirSync(`${filePath}/source/`);
  fs.writeFileSync(`${filePath}/source/apiSpec.json`, sourceOperation.api.apiSpec);

  fs.mkdirSync(`${filePath}/targets/`);
  for (const targetOperation of targetOperations) {
    try {
      fs.mkdirSync(`${filePath}/targets/${targetOperation.api.id}/`);
      fs.writeFileSync(
        `${filePath}/targets/${targetOperation.api.id}/apiSpec.json`,
        targetOperation.api.apiSpec
      );
    } catch (err) {
      console.log(err);
    }
  }

  logger.info(`Select adapter generator`);
  switch (adapterType) {
    case AdapterType.JAVASCRIPT:
      await createJavaScriptAdapter(
        filePath,
        mapping,
        sourceOperation,
        targetOperations
      );
      break;
    default:
      throw new Error("Unkown adapter type");
  }

  //Create zip file
  var zip = new Zip();
  zip.addLocalFolder(filePath);
  zip.writeZip(`${filePath}.zip`);

  return fileId;
}

async function createJavaScriptAdapter(
  filePath: string,
  mapping: IAsyncApiMapping,
  sourceOperation: OperationData,
  targetOperations: OperationData[]
) {
  const targets: {
    id: string;
    fullId: string;
    topic: string;
    mapping: string;
  }[] = [];
  const generatedTargets: string[] = [];

  for (const target of targetOperations) {
    const generator = new AsyncApiGenerator(
      "./asyncapi-generator/target-template",
      `${filePath}/targets/${target.apiId}`,
      {
        templateParams: {
          server: target.server,
        },
      }
    );
    const targetPath = `${filePath}/targets/${target.apiId}/apiSpec.json`;

    targets.push({
      id: target.apiId,
      fullId: `${target.apiId}_${target.operationId}`,
      mapping: escapeQuote(
        stringifyedToJsonata(
          mapping.messageMappings[`${target.apiId}_${target.operationId}`]
        )
      ),
      topic: target.topic,
    });

    if (!generatedTargets.includes(target.apiId)) {
      await generator.generateFromFile(targetPath);
      generatedTargets.push(target.apiId);
    }
  }

  const generator = new AsyncApiGenerator(
    "./asyncapi-generator/source-template",
    `${filePath}/source`,
    {
      templateParams: {
        server: sourceOperation.server,
        sourceId: `${sourceOperation.apiId}_${sourceOperation.operationId}`,
        sourceTopic: sourceOperation.topic,
        mappingDirection: mapping.direction.toString(),
        targets,
      },
    }
  );
  await generator.generateFromFile(`${filePath}/source/apiSpec.json`);
}

async function getOperationInfo(
  apiSpec: string,
  operationId: string
): Promise<{ url: string; server: string } | undefined> {
  const apiObject = await AsyncApiParser.parse(apiSpec);

  const server = apiObject.servers()[0];
  const serverUrl = Object.entries(server.variables() || []).reduce(
    (url, [varname, value]) =>
      url.replace(new RegExp(`{${varname}}`, "g"), value.defaultValue()),
    server.url()
  );

  const urls = apiObject.channelNames();

  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    const channel = apiObject.channel(url);

    if (channel.hasPublish() && channel.publish().id() === operationId) {
      return { url, server: serverUrl };
    }

    if (channel.hasSubscribe() && channel.subscribe().id() === operationId) {
      return { url, server: serverUrl };
    }
  }

  return undefined;
}
