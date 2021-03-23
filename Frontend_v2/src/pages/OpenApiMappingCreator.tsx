/* eslint-disable @typescript-eslint/no-use-before-define */
import AddIcon from 'components/Icons/AddIcon';
import ClearIcon from 'components/Icons/ClearIcon';
import MappingContainer from 'components/MappingContainer';
import { MappingContextProvider } from 'contexts/MappingContext';
import { ApiType, OpenApiModel } from 'models/ApiModel';
import {
  MappingPair,
  MappingType,
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
import Select from 'react-select';
import { getApi, getApis } from 'services/apiservice';
import { AuthContext } from 'services/auth/authcontext';
import {
  createMapping,
  generateMapping,
  getMappedOperations,
  MappedOperations,
  pairs2Trans,
  recomputeAttributeMapping,
} from 'services/mappingservice';
import {
  ApiOption,
  ResponseOption,
  OperationOption,
  optionFilter,
} from 'utils/helpers/apiSelection';
import {
  parseApiSpec,
  getOperationIds,
  getResponseCodes,
  OpenApiOperation,
  getRequestSchema,
  getResponseSchema,
} from 'utils/helpers/swaggerParser';
import { flatten } from 'flat';
import MappingTest from 'components/MappingTest';
import generateAdapter from 'services/adapterservice';
import downloadFile from 'utils/helpers/download';
import InfoModal from 'components/InfoModal';
import ActionBar from 'components/ActionBar';
import { Schema } from 'utils/helpers/schemaHelpers';

function OpenApiMappingCreator(): ReactElement {
  const { authState } = useContext(AuthContext);

  const [error, setError] = useState<string>();

  // #region Load Apis
  const [apiOptions, setApiOptions] = useState<ApiOption[]>([]);

  const loadApis = useCallback(async (type: ApiType) => {
    try {
      const loadedApis = await getApis(type, true);

      setApiOptions(
        loadedApis.map((api) => ({
          value: api,
          label: api.name,
        })),
      );
    } catch (err) {
      console.log('Error loading apis', err);
    }
  }, []);

  useEffect(() => {
    loadApis(ApiType.OPEN_API);
  }, [loadApis]);
  // #endregion

  // #region Operation selections
  const [partialSourceOperation, setPartialSourceOperation] = useState<
    Partial<OpenApiOperation>
  >();
  const sourceOperation = useMemo<OpenApiOperation | undefined>(() => {
    if (isValidOperation(partialSourceOperation)) {
      return partialSourceOperation;
    }

    return undefined;
  }, [partialSourceOperation]);

  const [targetOperations, setTargetOperations] = useState<
    Record<string, OpenApiOperation>
  >();

  const [sourceRequestSchema, sourceResponseSchema] = useMemo<
    [Record<string, Schema>, Record<string, Schema>]
  >(() => {
    if (!sourceOperation || !sourceOperation.api.apiObject) {
      return [{}, {}];
    }

    const requestSchema = {
      [getId(sourceOperation)]:
        getRequestSchema(
          sourceOperation.api.apiObject,
          sourceOperation.operationId,
        ) ?? {},
    };

    const responseSchema = {
      [getId(sourceOperation)]:
        getResponseSchema(
          sourceOperation.api.apiObject,
          sourceOperation.operationId,
          sourceOperation.responseId,
        ) ?? {},
    };

    return [requestSchema, responseSchema];
  }, [sourceOperation]);

  const [targetRequestSchema, targetResponseSchema] = useMemo<
    [Record<string, Schema>, Record<string, Schema>]
  >(() => {
    if (!targetOperations) {
      return [{}, {}];
    }

    return Object.entries(targetOperations).reduce<
      [Record<string, Schema>, Record<string, Schema>]
    >(
      ([requestSchema, responseSchema], [key, operation]) => {
        const { api, operationId, responseId } = operation;

        if (!api.apiObject) {
          return [requestSchema, responseSchema];
        }

        const reqSchema = getRequestSchema(api.apiObject, operationId);
        const respSchema = getResponseSchema(
          api.apiObject,
          operationId,
          responseId,
        );

        if (!reqSchema || !respSchema) {
          return [requestSchema, responseSchema];
        }

        return [
          {
            ...requestSchema,
            [key]: reqSchema,
          },
          {
            ...responseSchema,
            [key]: respSchema,
          },
        ];
      },
      [{}, {}],
    );
  }, [targetOperations]);
  // #endregion

  // #region Mapping pairs
  const [requestMappingPairs, setRequestMappingPairs] = useState<MappingPair[]>(
    [],
  );
  const [responseMappingPairs, setResponseMappingPairs] = useState<
    MappingPair[]
  >([]);

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

  // #region Mapping initialization
  useEffect(() => {
    async function initializeMapping() {
      if (!sourceOperation || !targetOperations) {
        return;
      }

      const mappingResult = await generateMapping(
        sourceOperation,
        targetOperations,
      );

      setRequestMappingPairs(mappingResult.mappingPairs.request);
      setResponseMappingPairs(mappingResult.mappingPairs.response);
    }

    initializeMapping();
  }, [sourceOperation, targetOperations]);
  // #endregion

  // #region Attribute mapping recomputation
  const updateAttributeMapping = useCallback(async () => {
    if (!sourceOperation || !targetOperations) {
      return;
    }

    const combinedMappingPairs = [
      ...requestMappingPairs,
      ...responseMappingPairs,
    ];
    const result = await recomputeAttributeMapping(
      sourceOperation,
      targetOperations,
      combinedMappingPairs,
    );

    setUpdatedRequestMappingPairState((currentState) => {
      const currentMappingPairs = currentState.mappingPairs;

      const currentMappingPairAttributeIds = currentMappingPairs.map(
        (mappingPair) => mappingPair.requiredAttributeId,
      );

      // Filter out all already existing mapping pairs
      const filteredMappingPairs = result.mappingPairs.request.filter(
        (mappingPair) => {
          return !currentMappingPairAttributeIds.includes(
            mappingPair.requiredAttributeId,
          );
        },
      );

      return {
        mappingPairs: [...currentMappingPairs, ...filteredMappingPairs],
        preventUpdate: true,
      };
    });

    setUpdatedResponseMappingPairState((currentState) => {
      const currentMappingPairs = currentState.mappingPairs;

      const currentMappingPairAttributeIds = currentMappingPairs.map(
        (mappingPair) => mappingPair.requiredAttributeId,
      );

      // Filter out all already existing mapping pairs
      const filteredMappingPairs = result.mappingPairs.response.filter(
        (mappingPair) => {
          return !currentMappingPairAttributeIds.includes(
            mappingPair.requiredAttributeId,
          );
        },
      );

      return {
        mappingPairs: [...currentMappingPairs, ...filteredMappingPairs],
        preventUpdate: true,
      };
    });
  }, [
    requestMappingPairs,
    responseMappingPairs,
    sourceOperation,
    targetOperations,
  ]);

  useEffect(() => {
    if (!updatedRequestMappingPairState.preventUpdate) {
      updateAttributeMapping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedRequestMappingPairState]);

  useEffect(() => {
    if (!updatedResponseMappingPairState.preventUpdate) {
      updateAttributeMapping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedResponseMappingPairState]);
  // #endregion

  // #region Strict mode
  const [strictEnabled, setStrictEnabled] = useState<boolean>(true);
  // #endregion

  // #region Determine current mapping validity
  const isValid = useMemo(() => {
    if (!targetRequestSchema || !sourceResponseSchema) {
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

    const flatTargetRequest = Object.keys(flatten(targetRequestSchema));
    const flatRequestMapping = Object.keys(
      flatten(pairs2Trans(updatedRequestMappingPairState.mappingPairs)),
    );

    const flatSourceResponse = Object.keys(flatten(sourceResponseSchema));
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
    sourceResponseSchema,
    targetRequestSchema,
    updatedRequestMappingPairState.mappingPairs,
    updatedResponseMappingPairState.mappingPairs,
  ]);
  // #endregion

  // #region Interaction handlers
  const [saving, setSaving] = useState<boolean>(false);
  const handleSaveMapping = useCallback(async () => {
    if (
      !isValid ||
      !strictEnabled ||
      !authState.user?.id ||
      !sourceOperation ||
      !targetOperations
    ) {
      return;
    }

    setSaving(true);

    const mapping: OpenApiMappingModel = {
      apiType: ApiType.OPEN_API,
      type: MappingType.TRANSFORMATION,
      createdBy: authState.user.id,
      sourceId: getId(sourceOperation),
      targetIds: Object.keys(targetOperations),
      requestMapping: JSON.stringify(
        pairs2Trans(updatedRequestMappingPairState.mappingPairs),
      ),
      responseMapping: JSON.stringify(
        pairs2Trans(updatedResponseMappingPairState.mappingPairs),
      ),
    };

    try {
      await createMapping(mapping);
    } catch (err) {
      console.log(err);
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  }, [
    authState,
    sourceOperation,
    strictEnabled,
    isValid,
    targetOperations,
    updatedRequestMappingPairState.mappingPairs,
    updatedResponseMappingPairState.mappingPairs,
  ]);

  const [adapterCreating, setAdapterCreating] = useState<boolean>(false);
  const handleCreateAdapter = useCallback(async () => {
    if (!authState.user?.id || !sourceOperation || !targetOperations) {
      return;
    }

    setAdapterCreating(true);

    const mapping: OpenApiMappingModel = {
      apiType: ApiType.OPEN_API,
      type: MappingType.TRANSFORMATION,
      createdBy: authState.user.id,
      sourceId: getId(sourceOperation),
      targetIds: Object.keys(targetOperations),
      requestMapping: JSON.stringify(
        pairs2Trans(updatedRequestMappingPairState.mappingPairs),
      ),
      responseMapping: JSON.stringify(
        pairs2Trans(updatedResponseMappingPairState.mappingPairs),
      ),
    };

    try {
      const downloadLink = await generateAdapter(mapping, 'javascript');

      downloadFile(downloadLink, 'adapter.zip');
    } catch (err) {
      console.log(err);
      setError('An error occurred');
    } finally {
      setAdapterCreating(false);
    }
  }, [
    authState,
    sourceOperation,
    targetOperations,
    updatedRequestMappingPairState.mappingPairs,
    updatedResponseMappingPairState.mappingPairs,
  ]);

  const handleClear = useCallback(() => {
    setPartialSourceOperation(undefined);
    setTargetOperations(undefined);
    setRequestMappingPairs([]);
    setResponseMappingPairs([]);
  }, []);
  // #endregion

  return (
    <div className="w-11/12 flex flex-col pb-8">
      <InfoModal
        isOpen={error !== undefined}
        onDismiss={() => setError(undefined)}
        header="Error"
        message={error ?? ''}
      />

      {/* API selection */}
      <div className="flex -mx-1">
        <div className="w-1/2 px-1 flex flex-col justify-between">
          <p className="font-bold">Source</p>
          <SingleSelection
            apiOptions={apiOptions}
            operation={partialSourceOperation}
            setOperation={setPartialSourceOperation}
          />
        </div>
        <div className="w-1/2 px-1 flex flex-col">
          <p className="font-bold">Targets</p>
          <MultiSelection
            apiOptions={apiOptions}
            operations={targetOperations}
            setOperations={setTargetOperations}
            sourceOperation={sourceOperation}
          />
        </div>
      </div>

      {/* Request */}
      <MappingContextProvider>
        <MappingContainer
          title="Request"
          required="target"
          strict={strictEnabled}
          mappingPairs={requestMappingPairs}
          onMappingPairsChange={(mappingPairs) => {
            setUpdatedRequestMappingPairState({
              mappingPairs,
            });
          }}
          sourceSchema={sourceRequestSchema}
          targetSchema={targetRequestSchema}
        />
      </MappingContextProvider>

      {/* Response */}
      <MappingContextProvider>
        <MappingContainer
          title="Response"
          required="source"
          strict={strictEnabled}
          mappingPairs={responseMappingPairs}
          onMappingPairsChange={(mappingPairs) =>
            setUpdatedResponseMappingPairState({
              mappingPairs,
            })
          }
          sourceSchema={sourceResponseSchema}
          targetSchema={targetResponseSchema}
        />
      </MappingContextProvider>

      {/* Testing */}
      <MappingTest
        requestMappingPairs={updatedRequestMappingPairState.mappingPairs}
        responseMappingPairs={updatedResponseMappingPairState.mappingPairs}
        sourceRequestSchema={sourceRequestSchema}
        targetOperations={targetOperations}
      />

      {/* Bottom bar */}
      <ActionBar
        adapterCreating={adapterCreating}
        saving={saving}
        mappingValid={isValid}
        strict={strictEnabled}
        toggleStrict={() => setStrictEnabled((curr) => !curr)}
        onClear={handleClear}
        onSave={handleSaveMapping}
        onCreateAdapter={handleCreateAdapter}
      />
    </div>
  );
}

// #region Single Operation selection
interface SingleSelectionProps {
  apiOptions: ApiOption[];
  operation: Partial<OpenApiOperation> | undefined;
  setOperation: (operation?: Partial<OpenApiOperation>) => void;
  sourceOperation?: OpenApiOperation;
}
function SingleSelection(props: SingleSelectionProps) {
  const { operation, setOperation, apiOptions, sourceOperation } = props;

  const [loading, setLoading] = useState<boolean>(false);

  // #region Selected parts
  const [selectedApi, setSelectedApi] = useState<OpenApiModel>();
  const [selectedOperation, setSelectedOperation] = useState<string>();
  const [selectedResponse, setSelectedResponse] = useState<string>();
  // #endregion

  // #region Selection states
  const [selectedApiOption, setSelectedApiOption] = useState<ApiOption | null>(
    null,
  );
  const [
    selectedOperationOption,
    setSelectedOperationOption,
  ] = useState<OperationOption | null>(null);
  const [
    selectedResponseOption,
    setSelectedResponseOption,
  ] = useState<ResponseOption | null>(null);
  // #endregion

  // #region Selection options
  const [operationOptions, setOperationOptions] = useState<OperationOption[]>(
    [],
  );
  const [responseOptions, setResponseOptions] = useState<ResponseOption[]>([]);
  // #endregion

  // #region Load options
  const loadFullApi = useCallback(async (apiId: string): Promise<
    OpenApiModel | undefined
  > => {
    try {
      const apiData = await getApi<OpenApiModel>(apiId, false);
      apiData.apiObject = await parseApiSpec(apiData.apiSpec);

      return apiData;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }, []);

  const loadOperationOptions = useCallback(
    async (api: OpenApiModel, srcOperation?: OpenApiOperation) => {
      if (!api.apiObject) {
        return [];
      }

      let mappedOperations: MappedOperations = [];
      if (srcOperation) {
        mappedOperations = await getMappedOperations(
          ApiType.OPEN_API,
          getId(srcOperation),
          api.id,
        );
      }

      const operationIds = getOperationIds(api.apiObject);
      const options = operationIds
        .map((operationId) => {
          const alreadyMapped = mappedOperations.some(
            (op) => op.operationId === operationId,
          );

          return {
            alreadyMapped,
            operationId,
          };
        })
        .sort((a, b) => {
          if (a.alreadyMapped && !b.alreadyMapped) {
            return -1;
          }

          if (!a.alreadyMapped && b.alreadyMapped) {
            return 1;
          }

          return 0;
        })
        .map<OperationOption>(({ alreadyMapped, operationId }) => {
          return {
            label: `${alreadyMapped ? '* ' : ''}${operationId}`,
            value: { operationId },
          };
        });

      return options;
    },
    [],
  );

  const loadResponseOptions = useCallback(
    (api: OpenApiModel, operationId: string) => {
      if (!api.apiObject) {
        return [];
      }

      const responseCodes = getResponseCodes(api.apiObject, operationId);
      const options = responseCodes.map<ResponseOption>((responseCode) => ({
        label: responseCode,
        value: { responseId: responseCode },
      }));

      return options;
    },
    [],
  );
  // #endregion

  // #region Handle operation prop change
  useEffect(() => {
    async function initialize() {
      setLoading(true);

      if (!operation) {
        setSelectedApi(undefined);
        setSelectedApiOption(null);

        setSelectedOperation(undefined);
        setOperationOptions([]);
        setSelectedOperationOption(null);

        setSelectedResponse(undefined);
        setResponseOptions([]);
        setSelectedResponseOption(null);

        setLoading(false);
        return;
      }

      let api = selectedApi;
      let operOptions: OperationOption[] = operationOptions;
      let respOptions: ResponseOption[] = responseOptions;

      if (selectedApi !== operation.api) {
        const apiOption = apiOptions.find(
          (option) => option.value.id === operation.api?.id,
        );
        api = apiOption && (await loadFullApi(apiOption.value.id));

        setSelectedApi(api);
        setSelectedApiOption(apiOption ?? null);
        operOptions = api ? await loadOperationOptions(api) : [];
        setOperationOptions(operOptions);
      }

      if (selectedOperation !== operation.operationId) {
        const operationOption = operOptions.find(
          (option) => option.value.operationId === operation.operationId,
        );

        setSelectedOperation(operation.operationId);
        setSelectedOperationOption(operationOption ?? null);
        respOptions =
          api && operation.operationId
            ? await loadResponseOptions(api, operation.operationId)
            : [];
        setResponseOptions(respOptions);
      }

      if (selectedResponse !== operation.responseId) {
        const responseOption = respOptions.find(
          (option) => option.value.responseId === operation.responseId,
        );

        setSelectedResponse(operation.responseId);
        setSelectedResponseOption(responseOption ?? null);
      }

      setLoading(false);
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operation]);
  // #endregion

  // #region Handle manual api change
  useEffect(() => {
    if (loading) {
      return;
    }

    // Reset other selections
    setSelectedOperationOption(null);
    setSelectedResponseOption(null);

    if (selectedApiOption) {
      loadFullApi(selectedApiOption?.value.id).then(setSelectedApi);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApiOption]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (selectedApi) {
      loadOperationOptions(selectedApi, sourceOperation).then(
        setOperationOptions,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceOperation, selectedApi]);
  // #endregion

  // #region Handle manual operation change
  useEffect(() => {
    if (loading) {
      return;
    }

    // Reset other selections
    setSelectedResponseOption(null);

    setSelectedOperation(selectedOperationOption?.value.operationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOperationOption]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (selectedApi && selectedOperation) {
      const options = loadResponseOptions(selectedApi, selectedOperation);
      setResponseOptions(options);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOperation]);
  // #endregion

  // #region Handle manual response change
  useEffect(() => {
    if (loading) {
      return;
    }

    setSelectedResponse(selectedResponseOption?.value.responseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResponseOption]);
  // #endregion

  // #region Emit changed operation
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!selectedApi && !selectedOperation && !selectedResponse) {
      setOperation(undefined);
      return;
    }

    setOperation({
      api: selectedApi,
      operationId: selectedOperation,
      responseId: selectedResponse,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApi, selectedOperation, selectedResponse]);
  // #endregion

  return (
    <div className="flex flex-col">
      <Select
        className="w-full"
        value={selectedApiOption}
        isSearchable
        isClearable
        onChange={(value) => setSelectedApiOption(value ?? null)}
        options={apiOptions}
        filterOption={optionFilter}
      />
      <div className="w-full flex mt-2">
        <Select
          className="w-full"
          value={selectedOperationOption}
          isSearchable
          onChange={(value) => setSelectedOperationOption(value ?? null)}
          options={operationOptions}
        />
        <Select
          className="ml-2 w-1/3"
          value={selectedResponseOption}
          isSearchable
          onChange={(value) => setSelectedResponseOption(value ?? null)}
          options={responseOptions}
        />
      </div>
    </div>
  );
}
// #endregion

// #region Multi Operation Selection
interface MultiSelectionProps {
  apiOptions: ApiOption[];
  operations: Record<string, OpenApiOperation> | undefined;
  setOperations: React.Dispatch<
    React.SetStateAction<Record<string, OpenApiOperation> | undefined>
  >;
  sourceOperation?: OpenApiOperation;
}
function MultiSelection(props: MultiSelectionProps) {
  const { apiOptions, operations, setOperations, sourceOperation } = props;

  // #region Selection & update management
  const [
    selectedOperation,
    setSelectedOperation,
  ] = useState<OpenApiOperation>();
  const [partialSelectedOperation, setPartialSelectedOperation] = useState<
    Partial<OpenApiOperation>
  >();

  useEffect(() => {
    if (
      !isValidOperation(partialSelectedOperation) ||
      operationEquals(partialSelectedOperation, selectedOperation)
    ) {
      return;
    }

    if (selectedOperation === undefined) {
      addOperation(partialSelectedOperation);
      return;
    }

    replaceOperation(selectedOperation, partialSelectedOperation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partialSelectedOperation]);
  // #endregion

  // #region Manage operations
  const addOperation = useCallback(
    (operation: OpenApiOperation) => {
      setOperations((currentOperations) => ({
        ...currentOperations,
        [getId(operation)]: operation,
      }));

      setSelectedOperation(operation);
      setPartialSelectedOperation(operation);
    },
    [setOperations],
  );

  const replaceOperation = useCallback(
    (oldOperation: OpenApiOperation, newOperation: OpenApiOperation) => {
      setOperations((currentOperations) => {
        if (!currentOperations) {
          return undefined;
        }

        return Object.entries(currentOperations).reduce(
          (newOperations, [id, operation]) => {
            if (getId(oldOperation) === id) {
              return {
                ...newOperations,
                [getId(newOperation)]: newOperation,
              };
            }

            return {
              ...newOperations,
              [id]: operation,
            };
          },
          {},
        );
      });

      setSelectedOperation(newOperation);
      setPartialSelectedOperation(newOperation);
    },
    [setOperations],
  );

  const removeOperation = useCallback(
    (operation: OpenApiOperation) => {
      setOperations((currentOperations) => {
        const { [getId(operation)]: deleted, ...rest } =
          currentOperations ?? {};

        return rest;
      });

      if (selectedOperation === operation) {
        setSelectedOperation(undefined);
        setPartialSelectedOperation(undefined);
      }
    },
    [setOperations, selectedOperation, setSelectedOperation],
  );
  // #endregion

  // #region Handle clear
  useEffect(() => {
    if (!operations) {
      setSelectedOperation(undefined);
      setPartialSelectedOperation(undefined);
    }
  }, [operations]);
  // #endregion

  return (
    <div className="flex flex-col">
      <div className="flex overflow-x-auto">
        {operations &&
          Object.values(operations).map((operation) => (
            <button
              key={getId(operation)}
              type="button"
              className="chip mx-1"
              onClick={() => {
                setSelectedOperation(operation);
                setPartialSelectedOperation(operation);
              }}
            >
              {operation.api.name}
              <div className="border-l ml-2 pl-2 flex items-center">
                <ClearIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOperation(operation);
                  }}
                  className="h-4 w-4"
                />
              </div>
            </button>
          ))}
        <button
          type="button"
          className="chip border-dashed mx-1 h-8"
          onClick={() => {
            setSelectedOperation(undefined);
            setPartialSelectedOperation(undefined);
          }}
        >
          <AddIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2">
        <SingleSelection
          key="default"
          apiOptions={apiOptions}
          operation={partialSelectedOperation}
          setOperation={setPartialSelectedOperation}
          sourceOperation={sourceOperation}
        />
      </div>
    </div>
  );
}
// #endregion

// #region Helper
function getId(operation?: OpenApiOperation): string {
  if (!operation) {
    return '';
  }
  return `${operation.api.id}_${operation.operationId}_${operation.responseId}`;
}

function isValidOperation(
  operation: Partial<OpenApiOperation> | undefined,
): operation is OpenApiOperation {
  return (
    operation !== undefined &&
    operation.api !== undefined &&
    operation.operationId !== undefined &&
    operation.responseId !== undefined
  );
}

function operationEquals(a?: OpenApiOperation, b?: OpenApiOperation) {
  return (
    a !== undefined &&
    b !== undefined &&
    a.api.id === b.api.id &&
    a.operationId === b.operationId &&
    a.responseId === b.responseId
  );
}
// #endregion

export default OpenApiMappingCreator;
