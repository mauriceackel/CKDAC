import { exec } from "child_process";
import { STORAGE_PATH } from "../../config/Config";
import { ApiType } from "../../models/ApiModel";
import { IOpenApiMapping } from "../../models/MappingModel";
import { logger } from "../../Service";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { AdapterType, SupportedAdapters } from "../../utils/enums/AdapterTypes";
import { NoSuchElementError } from "../../utils/errors/NoSuchElementError";
import { escapeQuote, stringifyedToJsonata } from "../../utils/jsonata-helpers";
import * as ApiService from "../ApiService";
import Zip from "adm-zip";
import { camelcase } from "../../utils/camelcase";

export async function createAdapter(adapterType: AdapterType, mapping: IOpenApiMapping, userId: string): Promise<string> {
    logger.info(`Trying to create open api adapter for type: ${adapterType}`);

    const adapterAvailable = SupportedAdapters.get(ApiType.OPEN_API)?.includes(adapterType) || false;
    if (!adapterAvailable) {
        throw new NoSuchElementError(`Adapter type ${adapterType} is not supported for this kind of mapping`);
    }

    const [sourceApiId, sourceOperationId, sourceResponseId] = mapping.sourceId.split('_');
    const sourceOperation = { apiId: sourceApiId, operationId: sourceOperationId, responseId: sourceResponseId };

    const targetOperations = mapping.targetIds.map(id => {
        const [targetApiId, targetOperationId, targetResponseId] = id.split('_');
        return { apiId: targetApiId, operationId: targetOperationId, responseId: targetResponseId };
    });

    logger.info(`Loading APIs`);
    const [source, ...targets] = await Promise.all([
        ApiService.getApiById(sourceApiId),
        ...targetOperations.map(api => ApiService.getApiById(api.apiId))
    ]);

    const fileId = uuidv4();
    const filePath = `${STORAGE_PATH}/${userId}/${fileId}`;

    logger.info(`Writing specs`);
    fs.mkdirSync(filePath, { recursive: true });

    fs.mkdirSync(`${filePath}/source/`);
    fs.writeFileSync(`${filePath}/source/apiSpec.json`, source.apiSpec);

    fs.mkdirSync(`${filePath}/targets/`);
    for (const target of targets) {
        try {
            fs.mkdirSync(`${filePath}/targets/${target.id}/`);
            fs.writeFileSync(`${filePath}/targets/${target.id}/apiSpec.json`, target.apiSpec);
        } catch (err) {
            console.log(err);
        }
    }

    logger.info(`Select adapter generator`);
    switch (adapterType) {
        case AdapterType.JAVASCRIPT: await createJavaScriptAdapter(filePath, mapping, sourceOperation, targetOperations); break;
        default: throw new Error("Unkown adapter type");
    }

    //Create zip file
    var zip = new Zip();
    zip.addLocalFolder(filePath);
    zip.writeZip(`${filePath}.zip`);

    return fileId;
}

async function createJavaScriptAdapter(
    filePath: string, mapping: IOpenApiMapping,
    sourceOperation: { apiId: string; operationId: string; responseId: string; },
    targetOperations: { apiId: string; operationId: string; responseId: string; }[]
) {
    const responseMapping = Buffer.from(escapeQuote(stringifyedToJsonata(mapping.responseMapping))).toString('base64');
    const requestMapping = Buffer.from(escapeQuote(stringifyedToJsonata(mapping.requestMapping))).toString('base64');

    const additionalParameters: string[] = [];
    additionalParameters.push(`operationId=${camelcase(sourceOperation.operationId)}`);
    additionalParameters.push(`sourceFullId=${sourceOperation.apiId}_${sourceOperation.operationId}_${sourceOperation.responseId}`);
    additionalParameters.push(`requestMapping=${requestMapping}`);
    additionalParameters.push(`responseMapping=${responseMapping}`);
    additionalParameters.push(`usePromises=true`);
    additionalParameters.push(`projectVersion=0.0.1`);

    const targetInfos: string[] = [];
    for (const target of targetOperations) {
        const targetPath = `${filePath}/targets/${target.apiId}`;

        await generateOpenApiInterface('javascript-target', targetPath, `operationId=${camelcase(target.operationId)},usePromises=true,projectVersion=0.0.1`);
        const { targetApiName, targetHasBody, targetBodyName, targetBodyRequired, targetOptions, targetHasOptional } = parseJavaScriptTarget(targetPath);

        const targetInfo: { [key: string]: string | boolean } = {
            targetApiId: target.apiId,
            targetFullId: `${target.apiId}_${target.operationId}_${target.responseId}`,
            targetApiPath: `../../../targets/${target.apiId}`,
            targetApiName,
            targetFunctionName: target.operationId,
        }
        if (targetOptions && targetOptions.length > 0) targetInfo.targetOptions = targetOptions.join(', ');
        if (targetHasBody) targetInfo.targetHasBody = true;
        if (targetBodyName) targetInfo.targetBodyName = targetBodyName;
        if (targetHasOptional) targetInfo.targetHasOptional = true;

        targetInfos.push(Buffer.from(JSON.stringify(targetInfo)).toString('base64'));
    }
    additionalParameters.push(`targets=${targetInfos.join('.')}`);

    await generateOpenApiInterface(
        'javascript-adapter',
        `${filePath}/source`,
        additionalParameters.join(',')
    );
}



// ----------- HELPERS ------------ //
function parseJavaScriptTarget(filePath: string): { targetApiName: string, targetHasBody: boolean, targetBodyName: string, targetBodyRequired: boolean, targetOptions: Array<string>, targetHasOptional: boolean } {
    const targetApiFilePath = `${filePath}/parsed-target.txt`;
    const targetApiFile = fs.readFileSync(targetApiFilePath, { encoding: "utf-8" });

    const [targetApiName, targetHasBody, targetBodyName, targetBodyRequired, targetOptions, targetHasOptional] = targetApiFile.split('\n');

    fs.unlinkSync(targetApiFilePath);

    return {
        targetApiName,
        targetHasBody: targetHasBody === 'true',
        targetBodyName,
        targetBodyRequired: targetBodyRequired === 'true',
        targetOptions: targetOptions.split(',').map(o => o.trim()).filter(o => o !== 'opts'),
        targetHasOptional: targetHasOptional === 'true'
    };
}

async function generateOpenApiInterface(generator: string, path: string, options?: string) {
    const additionalOptions = options ? ` -p=${options}` : '';
    const executable = "java -cp openapi-generator/javascript-adapter-openapi-generator-1.0.0.jar:openapi-generator/javascript-target-openapi-generator-1.0.0.jar:openapi-generator/openapi-generator-cli.jar org.openapitools.codegen.OpenAPIGenerator";

    const command = `${executable} generate -g ${generator} -i ${path}/apiSpec.json -o ${path}${additionalOptions}`;

    return new Promise((resolve, reject) => {
        const child = exec(command, (error, stdout, stderr) => console.log(error, stdout, stderr));
        child.on('close', resolve);
        child.on('error', reject);
    })
}