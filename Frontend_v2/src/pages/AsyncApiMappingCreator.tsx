/* eslint-disable @typescript-eslint/no-use-before-define */
import MappingContainer from 'components/MappingContainer';
import { MappingContextProvider } from 'contexts/MappingContext';
import { ApiType, AsyncApiModel } from 'models/ApiModel';
import {
  AsyncApiMappingModel,
  MappingDirection,
  MappingPair,
  MappingType,
} from 'models/MappingModel';
import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  OperationOption,
  optionFilter,
} from 'utils/helpers/apiSelection';
import { flatten } from 'flat';
import generateAdapter from 'services/adapterservice';
import downloadFile from 'utils/helpers/download';
import InfoModal from 'components/InfoModal';
import ActionBar from 'components/ActionBar';
import {
  AsyncApiOperation,
  getMessageSchema,
  getOperationIds,
  parseApiSpec,
} from 'utils/helpers/asyncApiParser';
import { Schema } from 'utils/helpers/schemaHelpers';
import Select from 'react-select';
import ClearIcon from 'components/Icons/ClearIcon';
import AddIcon from 'components/Icons/AddIcon';
import CheckIcon from 'components/Icons/CheckIcon';
import {
  clusterMappingPairs,
  computeMessageMapping,
} from 'utils/helpers/mappingHelpers';

function AsyncApiMappingCreator(): ReactElement {
  const { authState } = useContext(AuthContext);

  const [error, setError] = useState<string>();

  // #region Mapping direction
  // In AsyncApi, we need to explicitly say which side will be required and which will be provided
  // because it depends on the type of operation. Hence, this value determines whether the source
  // is considered as in INPUT (i.e. source is required, source only shows publish operations, this
  // might seem weird but according to the docs [https://www.asyncapi.com/docs/getting-started/hello-world]
  // if an operation is marked as 'publish', it means that OTHERS can publish to it and the source subscribed)
  // or as an OUTPUT (i.e. target is required, source only shows subscribe operations)

  const [mappingDirection, setMappingDirection] = useState<MappingDirection>(
    MappingDirection.INPUT,
  );

  const toggleDirection = useCallback(() => {
    setMappingDirection((currentDirection) => {
      if (currentDirection === MappingDirection.INPUT) {
        return MappingDirection.OUTPUT;
      }

      return MappingDirection.INPUT;
    });
  }, []);
  // #endregion

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
    loadApis(ApiType.ASYNC_API);
  }, [loadApis]);
  // #endregion

  // #region Operation selections
  const [partialSourceOperation, setPartialSourceOperation] = useState<
    Partial<AsyncApiOperation>
  >();
  const sourceOperation = useMemo<AsyncApiOperation | undefined>(() => {
    if (isValidOperation(partialSourceOperation)) {
      return partialSourceOperation;
    }

    return undefined;
  }, [partialSourceOperation]);

  const [targetOperations, setTargetOperations] = useState<
    Record<string, AsyncApiOperation>
  >();

  const sourceMessageSchema = useMemo<Record<string, Schema>>(() => {
    if (!sourceOperation || !sourceOperation.api.apiObject) {
      return {};
    }

    const messageSchema = {
      [getId(sourceOperation)]:
        getMessageSchema(
          sourceOperation.api.apiObject,
          sourceOperation.operationId,
        ) ?? {},
    };

    return messageSchema;
  }, [sourceOperation]);

  const targetMessageSchema = useMemo<Record<string, Schema>>(() => {
    if (!targetOperations) {
      return {};
    }

    return Object.entries(targetOperations).reduce<Record<string, Schema>>(
      (messageSchema, [key, operation]) => {
        const { api, operationId } = operation;

        if (!api.apiObject) {
          return messageSchema;
        }

        const schema = getMessageSchema(api.apiObject, operationId);

        if (!schema) {
          return messageSchema;
        }

        return {
          ...messageSchema,
          [key]: schema,
        };
      },
      {},
    );
  }, [targetOperations]);
  // #endregion

  // #region Mapping pairs
  const [messageMappingPairs, setMessageMappingPairs] = useState<MappingPair[]>(
    [],
  );

  const [updatedMessageMappingPairs, setUpdatedMessageMappingPairs] = useState<
    MappingPair[]
  >([]);
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
        mappingDirection,
      );

      setMessageMappingPairs(mappingResult.mappingPairs);
    }

    initializeMapping();
  }, [sourceOperation, targetOperations, mappingDirection]);
  // #endregion

  // #region Attribute mapping recomputation
  const handleAddMappingPair = useCallback(async () => {
    if (!sourceOperation || !targetOperations) {
      return [];
    }

    const result = await recomputeAttributeMapping(
      sourceOperation,
      targetOperations,
      messageMappingPairs,
      mappingDirection,
    );

    return result.mappingPairs;
  }, [
    messageMappingPairs,
    sourceOperation,
    targetOperations,
    mappingDirection,
  ]);
  // #endregion

  // #region Strict mode
  const [strictEnabled, setStrictEnabled] = useState<boolean>(true);
  // #endregion

  // #region Determine current mapping validity
  const isValid = useMemo(() => {
    if (!targetMessageSchema || !sourceMessageSchema) {
      return false;
    }

    if (
      updatedMessageMappingPairs.some(
        (mappingPair) => !mappingPair.mappingTransformation,
      )
    ) {
      return false;
    }

    const clusteredMappingPairs = clusterMappingPairs(
      updatedMessageMappingPairs,
      mappingDirection,
    );

    const valid = Object.keys(targetMessageSchema).every((targetId) => {
      // Check for every target
      const flatRequiredSchema = Object.keys(
        flatten(
          mappingDirection === MappingDirection.INPUT
            ? sourceMessageSchema
            : { [targetId]: targetMessageSchema[targetId] }, // Extract a single target
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
    sourceMessageSchema,
    targetMessageSchema,
    updatedMessageMappingPairs,
    mappingDirection,
  ]);
  // #endregion

  // #region Interaction handlers
  const handleClear = useCallback(() => {
    setPartialSourceOperation(undefined);
    setTargetOperations(undefined);
    setMessageMappingPairs([]);
  }, []);

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

    const mapping: AsyncApiMappingModel = {
      apiType: ApiType.ASYNC_API,
      type: MappingType.TRANSFORMATION,
      createdBy: authState.user.id,
      sourceId: getId(sourceOperation),
      targetIds: Object.keys(targetOperations),
      direction: mappingDirection,
      messageMappings: computeMessageMapping(
        updatedMessageMappingPairs,
        mappingDirection,
      ),
    };

    try {
      await createMapping(mapping);
    } catch (err) {
      console.log(err);
      setError('An error occurred');
    } finally {
      setSaving(false);
      handleClear();
    }
  }, [
    isValid,
    strictEnabled,
    authState.user,
    sourceOperation,
    handleClear,
    targetOperations,
    updatedMessageMappingPairs,
    mappingDirection,
  ]);

  const [adapterCreating, setAdapterCreating] = useState<boolean>(false);
  const handleCreateAdapter = useCallback(async () => {
    if (!authState.user?.id || !sourceOperation || !targetOperations) {
      return;
    }

    setAdapterCreating(true);

    const mapping: AsyncApiMappingModel = {
      apiType: ApiType.ASYNC_API,
      type: MappingType.TRANSFORMATION,
      createdBy: authState.user.id,
      sourceId: getId(sourceOperation),
      targetIds: Object.keys(targetOperations),
      direction: mappingDirection,
      messageMappings: computeMessageMapping(
        updatedMessageMappingPairs,
        mappingDirection,
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
    mappingDirection,
    updatedMessageMappingPairs,
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

      {/* API selection */}
      <div className="flex -mx-1">
        <div className="w-1/2 px-1 flex flex-col justify-between">
          <p className="font-bold">Source</p>
          <div>
            <label htmlFor="cbx-direction" className="flex">
              <div className="w-6 h-6 mr-2 rounded border">
                {mappingDirection === MappingDirection.INPUT && (
                  <CheckIcon className="w-6 h-6" />
                )}
              </div>
              Publish Operations (Source is required)
              <input
                id="cbx-direction"
                type="checkbox"
                className="hidden"
                checked={mappingDirection === MappingDirection.INPUT}
                readOnly
                onClick={toggleDirection}
              />
            </label>
          </div>
          <SingleSelection
            operationType={
              mappingDirection === MappingDirection.INPUT
                ? 'publish'
                : 'subscribe'
            }
            apiOptions={apiOptions}
            operation={partialSourceOperation}
            setOperation={setPartialSourceOperation}
          />
        </div>
        <div className="w-1/2 px-1 flex flex-col">
          <p className="font-bold">Targets</p>
          <MultiSelection
            operationType={
              mappingDirection === MappingDirection.INPUT
                ? 'publish'
                : 'subscribe'
            }
            apiOptions={apiOptions}
            operations={targetOperations}
            setOperations={setTargetOperations}
            sourceOperation={sourceOperation}
          />
        </div>
      </div>

      {/* Message */}
      <MappingContextProvider>
        <MappingContainer
          title="Request"
          required={
            mappingDirection === MappingDirection.INPUT ? 'source' : 'target'
          }
          strict={strictEnabled}
          mappingPairs={messageMappingPairs}
          onMappingPairsChange={setUpdatedMessageMappingPairs}
          addMappingInterceptor={handleAddMappingPair}
          noMixed
          allowMultiMapping
          // If the target side is the provided side, require a selection in order
          // to be able to differentiate where a static value mapping belongs to
          requireProvided={mappingDirection === MappingDirection.INPUT}
          sourceSchema={sourceMessageSchema}
          targetSchema={targetMessageSchema}
        />
      </MappingContextProvider>

      {/* Testing */}

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
  operationType: 'publish' | 'subscribe';
  apiOptions: ApiOption[];
  operation: Partial<AsyncApiOperation> | undefined;
  setOperation: (operation?: Partial<AsyncApiOperation>) => void;
  sourceOperation?: AsyncApiOperation;
}
function SingleSelection(props: SingleSelectionProps) {
  const {
    operationType,
    operation,
    setOperation,
    apiOptions,
    sourceOperation,
  } = props;

  const [loading, setLoading] = useState<boolean>(false);

  // #region Selected parts
  const [selectedApi, setSelectedApi] = useState<AsyncApiModel>();
  const [selectedOperation, setSelectedOperation] = useState<string>();
  // #endregion

  // #region Selection states
  const [selectedApiOption, setSelectedApiOption] = useState<ApiOption | null>(
    null,
  );
  const [
    selectedOperationOption,
    setSelectedOperationOption,
  ] = useState<OperationOption | null>(null);
  // #endregion

  // #region Selection options
  const [operationOptions, setOperationOptions] = useState<OperationOption[]>(
    [],
  );
  // #endregion

  // #region Load options
  const loadFullApi = useCallback(async (apiId: string) => {
    try {
      const apiData = await getApi<AsyncApiModel>(apiId, false);
      apiData.apiObject = await parseApiSpec(apiData.apiSpec);

      return apiData;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }, []);

  const loadOperationOptions = useCallback(
    async (api: AsyncApiModel, srcOperation?: AsyncApiOperation) => {
      if (!api.apiObject) {
        return [];
      }

      let mappedOperations: MappedOperations = [];
      if (srcOperation) {
        mappedOperations = await getMappedOperations(
          ApiType.ASYNC_API,
          getId(srcOperation),
          api.id,
        );
      }

      const operationIds = getOperationIds(api.apiObject, operationType);
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
    [operationType],
  );

  useEffect(() => {
    setSelectedOperationOption(null);
  }, [operationType]);
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

        setLoading(false);
        return;
      }

      let api = selectedApi;
      let operOptions: OperationOption[] = operationOptions;

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
  }, [sourceOperation, selectedApi, operationType]);
  // #endregion

  // #region Handle manual operation change
  useEffect(() => {
    if (loading) {
      return;
    }

    setSelectedOperation(selectedOperationOption?.value.operationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOperationOption]);
  // #endregion

  // #region Emit changed operation
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!selectedApi && !selectedOperation) {
      setOperation(undefined);
      return;
    }

    setOperation({
      api: selectedApi,
      operationId: selectedOperation,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApi, selectedOperation]);
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
      <Select
        className="w-full mt-2"
        value={selectedOperationOption}
        isSearchable
        onChange={(value) => setSelectedOperationOption(value ?? null)}
        options={operationOptions}
      />
    </div>
  );
}
// #endregion

// #region Multi Operation Selection
interface MultiSelectionProps {
  operationType: 'publish' | 'subscribe';
  apiOptions: ApiOption[];
  operations: Record<string, AsyncApiOperation> | undefined;
  setOperations: React.Dispatch<
    React.SetStateAction<Record<string, AsyncApiOperation> | undefined>
  >;
  sourceOperation?: AsyncApiOperation;
}
function MultiSelection(props: MultiSelectionProps) {
  const {
    operationType,
    apiOptions,
    operations,
    setOperations,
    sourceOperation,
  } = props;

  // #region Selection & update management
  const [
    selectedOperation,
    setSelectedOperation,
  ] = useState<AsyncApiOperation>();
  const [partialSelectedOperation, setPartialSelectedOperation] = useState<
    Partial<AsyncApiOperation>
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
    (operation: AsyncApiOperation) => {
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
    (oldOperation: AsyncApiOperation, newOperation: AsyncApiOperation) => {
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
    (operation: AsyncApiOperation) => {
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
          operationType={operationType}
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
function getId(operation?: AsyncApiOperation): string {
  if (!operation) {
    return '';
  }
  return `${operation.api.id}_${operation.operationId}`;
}

function isValidOperation(
  operation: Partial<AsyncApiOperation> | undefined,
): operation is AsyncApiOperation {
  return (
    operation !== undefined &&
    operation.api !== undefined &&
    operation.operationId !== undefined
  );
}

function operationEquals(a?: AsyncApiOperation, b?: AsyncApiOperation) {
  return (
    a !== undefined &&
    b !== undefined &&
    a.api.id === b.api.id &&
    a.operationId === b.operationId
  );
}
// #endregion

export default AsyncApiMappingCreator;
