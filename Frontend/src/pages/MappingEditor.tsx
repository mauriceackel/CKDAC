import InfoModal from 'components/InfoModal';
import MappingContainer from 'components/MappingContainer';
import Spinner from 'components/Spinner';
import { MappingContextProvider } from 'contexts/MappingContext';
import flatten from 'flat';
import { ApiType, AsyncApiModel, OpenApiModel } from 'models/ApiModel';
import {
  AsyncApiMappingModel,
  MappingDirection,
  MappingModel,
  MappingPair,
  OpenApiMappingModel,
} from 'models/MappingModel';
import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router';
import Select from 'react-select';
import { getApi } from 'services/apiservice';
import { AuthContext } from 'services/auth/authcontext';
import {
  getMappings,
  pairs2Trans,
  trans2Pairs,
  updateMapping,
} from 'services/mappingservice';
import { Schema } from 'utils/helpers/schemaHelpers';
import {
  getRequestSchema,
  getResponseSchema,
  parseApiSpec as parseOpenApiSpec,
} from 'utils/helpers/swaggerParser';
import {
  getMessageSchema,
  parseApiSpec as parseAsyncApiSpec,
} from 'utils/helpers/asyncApiParser';
import { clusterMappingPairs } from 'utils/helpers/mappingHelpers';

type MappingOption = {
  value: MappingModel;
  label: string;
};

function MappingEditor(): ReactElement {
  const { authState } = useContext(AuthContext);

  const [error, setError] = useState<string>();

  // #region Api mode
  const { mode } = useParams<{ mode: string }>();
  const apiType = useMemo(() => {
    switch (mode) {
      case 'openapi':
        return ApiType.OPEN_API;
      case 'asyncapi':
        return ApiType.ASYNC_API;
      default:
        return undefined;
    }
  }, [mode]);
  // #endregion

  // #region Load Mappings
  const [mappingOptions, setMappingOptions] = useState<MappingOption[]>();

  useEffect(() => {
    async function loadMappings() {
      if (!authState.user) {
        return;
      }

      const mappings = await getMappings({
        createdBy: authState.user.id,
        apiType,
      });

      const options = mappings.map(async (mapping) => {
        const [sourceApi, ...targetApis] = await Promise.all([
          getApi(mapping.sourceId.split('_')[0]),
          ...mapping.targetIds.map((tId) => getApi(tId.split('_')[0])),
        ]);

        const sourceLabel = `${sourceApi.name} (${
          mapping.sourceId.split('_')[1]
        })`;

        const targetsLabel = targetApis
          .map(
            (tApi, i) => `${tApi.name} (${mapping.targetIds[i].split('_')[1]})`,
          )
          .join(' & ');

        const prefix =
          mapping.apiType === ApiType.ASYNC_API
            ? `${
                (mapping as AsyncApiMappingModel).direction ===
                MappingDirection.INPUT
                  ? 'Publish'
                  : 'Subscribe'
              }: `
            : '';

        return {
          value: mapping,
          label: `${prefix}${sourceLabel} -> ${targetsLabel}`,
        };
      });

      setMappingOptions(await Promise.all(options));
    }

    loadMappings();
  }, [authState, apiType]);
  // #endregion

  // #region Mapping selection
  const [
    selectedMappingOption,
    setSelectedMappingOption,
  ] = useState<MappingOption | null>(null);

  const selectedMapping = useMemo(
    () => selectedMappingOption && selectedMappingOption.value,
    [selectedMappingOption],
  );

  const mappingDirection = useMemo<MappingDirection | undefined>(() => {
    if (selectedMapping?.apiType === ApiType.ASYNC_API) {
      return (selectedMapping as AsyncApiMappingModel).direction;
    }

    return undefined;
  }, [selectedMapping]);
  // #endregion

  // #region Mapping data
  const [requestData, setRequestData] = useState<{
    mappingPairs: MappingPair[];
    sourceSchema: Record<string, Schema>;
    targetSchema: Record<string, Schema>;
  }>();
  const [responseData, setResponseData] = useState<{
    mappingPairs: MappingPair[];
    sourceSchema: Record<string, Schema>;
    targetSchema: Record<string, Schema>;
  }>();

  useEffect(() => {
    async function loadOpenApiMappingData() {
      if (!selectedMapping) {
        return;
      }

      // [apiId, operationId, responseId]
      const sourceIdData = selectedMapping.sourceId.split('_');
      const targetIdData = selectedMapping.targetIds.map((targetId) =>
        targetId.split('_'),
      );

      const [sourceApi, ...targetApis] = await Promise.all<OpenApiModel>(
        [
          getApi<OpenApiModel>(sourceIdData[0], false),
          ...targetIdData.map((idData) =>
            getApi<OpenApiModel>(idData[0], false),
          ),
        ].map(async (apiPromise) => {
          const api = await apiPromise;
          const apiObject = await parseOpenApiSpec(api.apiSpec);
          return {
            ...api,
            apiObject,
          };
        }),
      );

      const sourceRequestSchema = {
        [sourceIdData.join('_')]:
          getRequestSchema(sourceApi.apiObject!, sourceIdData[1]) ?? {},
      };
      const sourceResponseSchema = {
        [sourceIdData.join('_')]:
          getResponseSchema(
            sourceApi.apiObject!,
            sourceIdData[1],
            sourceIdData[2],
          ) ?? {},
      };

      const targetRequestSchema = targetIdData.reduce<Record<string, Schema>>(
        (schema, idData) => {
          const targetApi = targetApis.find((api) => api.id === idData[0]);
          const requestSchema = getRequestSchema(
            targetApi!.apiObject!,
            idData[1],
          );

          if (!requestSchema) {
            return schema;
          }

          return {
            ...schema,
            [idData.join('_')]: requestSchema,
          };
        },
        {},
      );
      const targetResponseSchema = targetIdData.reduce<Record<string, Schema>>(
        (schema, idData) => {
          const targetApi = targetApis.find((api) => api.id === idData[0]);
          const responseSchema = getResponseSchema(
            targetApi!.apiObject!,
            idData[1],
            idData[2],
          );

          if (!responseSchema) {
            return schema;
          }

          return {
            ...schema,
            [idData.join('_')]: responseSchema,
          };
        },
        {},
      );

      const requestMappingPairs = trans2Pairs(
        JSON.parse((selectedMapping as OpenApiMappingModel).requestMapping),
      );
      const responseMappingPairs = trans2Pairs(
        JSON.parse((selectedMapping as OpenApiMappingModel).responseMapping),
      );

      setRequestData({
        mappingPairs: requestMappingPairs,
        sourceSchema: sourceRequestSchema,
        targetSchema: targetRequestSchema,
      });

      setResponseData({
        mappingPairs: responseMappingPairs,
        sourceSchema: sourceResponseSchema,
        targetSchema: targetResponseSchema,
      });
    }

    async function loadAsyncApiMappingData() {
      if (!selectedMapping) {
        return;
      }

      // [apiId, operationId]
      const sourceIdData = selectedMapping.sourceId.split('_');
      const targetIdData = selectedMapping.targetIds.map((targetId) =>
        targetId.split('_'),
      );

      const [sourceApi, ...targetApis] = await Promise.all<AsyncApiModel>(
        [
          getApi<AsyncApiModel>(sourceIdData[0], false),
          ...targetIdData.map((idData) =>
            getApi<AsyncApiModel>(idData[0], false),
          ),
        ].map(async (apiPromise) => {
          const api = await apiPromise;
          const apiObject = await parseAsyncApiSpec(api.apiSpec);
          return {
            ...api,
            apiObject,
          };
        }),
      );

      const sourceMessageSchema = {
        [sourceIdData.join('_')]:
          getMessageSchema(sourceApi.apiObject!, sourceIdData[1]) ?? {},
      };

      const targetMessageSchema = targetIdData.reduce<Record<string, Schema>>(
        (schema, idData) => {
          const targetApi = targetApis.find((api) => api.id === idData[0]);
          const requestSchema = getMessageSchema(
            targetApi!.apiObject!,
            idData[1],
          );

          if (!requestSchema) {
            return schema;
          }

          return {
            ...schema,
            [idData.join('_')]: requestSchema,
          };
        },
        {},
      );

      const mapping = selectedMapping as AsyncApiMappingModel;
      const messageMappingPairs = Object.entries(
        mapping.messageMappings,
      ).flatMap(([apiId, rawMapping]) =>
        trans2Pairs(JSON.parse(rawMapping), apiId),
      );

      setRequestData({
        mappingPairs: messageMappingPairs,
        sourceSchema: sourceMessageSchema,
        targetSchema: targetMessageSchema,
      });
    }

    if (selectedMapping?.apiType === ApiType.ASYNC_API) {
      loadAsyncApiMappingData();
    } else if (selectedMapping?.apiType === ApiType.OPEN_API) {
      loadOpenApiMappingData();
    }
  }, [selectedMapping]);
  // #endregion

  // #region Updated mapping data
  const [
    updatedRequestMappingPairState,
    setUpdatedRequestMappingPairState,
  ] = useState<{
    mappingPairs: MappingPair[];
    preventUpdate?: boolean;
  }>({
    mappingPairs: [],
  });

  const [
    updatedResponseMappingPairState,
    setUpdatedResponseMappingPairState,
  ] = useState<{
    mappingPairs: MappingPair[];
    preventUpdate?: boolean;
  }>({
    mappingPairs: [],
  });
  // #endregion

  // #region Determine current mapping validity
  const isValidOpenApi = useCallback(() => {
    if (!selectedMapping || !requestData || !responseData) {
      return false;
    }

    const combinedMappingPairs = [
      ...updatedRequestMappingPairState.mappingPairs,
      ...updatedResponseMappingPairState.mappingPairs,
    ];

    if (
      combinedMappingPairs.some(
        (mappingPair) => !mappingPair.mappingTransformation,
      )
    ) {
      return false;
    }

    const flatTargetRequest = Object.keys(flatten(requestData.targetSchema));
    const flatRequestMapping = Object.keys(
      flatten(pairs2Trans(updatedRequestMappingPairState.mappingPairs)),
    );

    const flatSourceResponse = Object.keys(flatten(responseData.sourceSchema));
    const flatResponseMapping = Object.keys(
      flatten(pairs2Trans(updatedResponseMappingPairState.mappingPairs)),
    );

    const missingRequest = flatTargetRequest.filter(
      (attributeId) => !flatRequestMapping.includes(attributeId),
    );
    const missingResponse = flatSourceResponse.filter(
      (attributeId) => !flatResponseMapping.includes(attributeId),
    );

    return missingRequest.length === 0 && missingResponse.length === 0;
  }, [
    requestData,
    responseData,
    selectedMapping,
    updatedRequestMappingPairState.mappingPairs,
    updatedResponseMappingPairState.mappingPairs,
  ]);

  const isValidAsyncApi = useCallback(() => {
    if (!selectedMapping || !requestData || mappingDirection === undefined) {
      return false;
    }

    if (
      updatedRequestMappingPairState.mappingPairs.some(
        (mappingPair) => !mappingPair.mappingTransformation,
      )
    ) {
      return false;
    }

    const clusteredMappingPairs = clusterMappingPairs(
      updatedRequestMappingPairState.mappingPairs,
      mappingDirection,
    );

    const valid = Object.keys(requestData.targetSchema).every((targetId) => {
      // Check for every target
      const flatRequiredSchema = Object.keys(
        flatten(
          mappingDirection === MappingDirection.INPUT
            ? requestData.sourceSchema
            : { [targetId]: requestData.targetSchema[targetId] }, // Extract a single target
        ),
      );
      const flatMapping = Object.keys(
        flatten(pairs2Trans(clusteredMappingPairs[targetId] ?? [])),
      );

      const missing = flatRequiredSchema.filter(
        (attributeId) => !flatMapping.includes(attributeId),
      );

      return missing.length === 0;
    });

    return valid;
  }, [
    mappingDirection,
    requestData,
    selectedMapping,
    updatedRequestMappingPairState.mappingPairs,
  ]);

  const isValid = useMemo(() => {
    if (apiType === ApiType.OPEN_API) {
      return isValidOpenApi();
    }
    if (apiType === ApiType.ASYNC_API) {
      return isValidAsyncApi();
    }
    return undefined;
  }, [apiType, isValidAsyncApi, isValidOpenApi]);
  // #endregion

  // #region Handle interactions
  const [saving, setSaving] = useState<boolean>(false);
  const handleSaveMapping = useCallback(async () => {
    if (!isValid || !authState.user?.id || !selectedMapping) {
      return;
    }

    setSaving(true);

    const mapping: OpenApiMappingModel = {
      ...selectedMapping,
      apiType: ApiType.OPEN_API,
      requestMapping: JSON.stringify(
        pairs2Trans(updatedRequestMappingPairState.mappingPairs),
      ),
      responseMapping: JSON.stringify(
        pairs2Trans(updatedResponseMappingPairState.mappingPairs),
      ),
    };

    try {
      await updateMapping(mapping);
    } catch (err) {
      console.log(err);
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  }, [
    isValid,
    authState.user?.id,
    selectedMapping,
    updatedRequestMappingPairState.mappingPairs,
    updatedResponseMappingPairState.mappingPairs,
  ]);
  // #endregion

  return (
    <div className="w-11/12 flex flex-col pb-8">
      <InfoModal
        isOpen={error !== undefined}
        onDismiss={() => setError(undefined)}
        header="Error"
        message={error ?? ''}
      />

      <Select
        className="w-full"
        value={selectedMappingOption}
        isClearable
        onChange={(value) => setSelectedMappingOption(value ?? null)}
        options={mappingOptions}
      />

      {selectedMapping && (
        <>
          {requestData && (
            <MappingContextProvider>
              <MappingContainer
                title="Request"
                required={
                  mappingDirection === MappingDirection.INPUT
                    ? 'source'
                    : 'target' // Will be target if mapping direction is undefined (i.e. OpenApi mapping)
                }
                strict={false}
                noMixed={apiType === ApiType.ASYNC_API}
                allowMultiMapping={apiType === ApiType.ASYNC_API}
                requireProvided={mappingDirection === MappingDirection.INPUT}
                mappingPairs={requestData.mappingPairs}
                sourceSchema={requestData.sourceSchema}
                targetSchema={requestData.targetSchema}
                onMappingPairsChange={(mappingPairs) => {
                  setUpdatedRequestMappingPairState({
                    mappingPairs,
                  });
                }}
              />
            </MappingContextProvider>
          )}
          {responseData && (
            <MappingContextProvider>
              <MappingContainer
                title="Response"
                required="source"
                strict={false}
                mappingPairs={responseData.mappingPairs}
                sourceSchema={responseData.sourceSchema}
                targetSchema={responseData.targetSchema}
                onMappingPairsChange={(mappingPairs) =>
                  setUpdatedResponseMappingPairState({
                    mappingPairs,
                  })
                }
              />
            </MappingContextProvider>
          )}
        </>
      )}

      <div className="mt-6 flex">
        <div className="flex-1" />
        <button
          type="button"
          disabled={saving || !isValid}
          className="button inline-flex items-center bg-green-800 text-white disabled:opacity-40"
          onClick={handleSaveMapping}
        >
          {saving ? (
            <>
              <Spinner />
              Saving...
            </>
          ) : (
            'Save Mapping'
          )}
        </button>
      </div>
    </div>
  );
}

export default MappingEditor;
