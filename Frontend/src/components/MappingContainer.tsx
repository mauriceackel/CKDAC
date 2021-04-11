/* eslint-disable @typescript-eslint/no-use-before-define */
import { MappingContext } from 'contexts/MappingContext';
import { MappingPair, MappingPairType } from 'models/MappingModel';
import React, {
  ReactElement,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { Collapse } from 'react-collapse';
import escapeJsonata from 'utils/helpers/escapeJsonata';
import { Schema } from 'utils/helpers/schemaHelpers';
import usePrompt from 'utils/hooks/usePrompt';
import Select from 'react-select';
import Modal from 'react-modal';
import ChevronRightIcon from './Icons/ChevronRightIcon';
import MappingArea from './MappingArea';
import SchemaTree from './SchemaTree';
import ClearIcon from './Icons/ClearIcon';

Modal.setAppElement('#root');

interface MappingContainerProps {
  title: string;
  strict: boolean; // If true, does not allow to alter mappings
  noMixed?: boolean; // If set to true, does not allow to select provided properties from different apis
  allowMultiMapping?: boolean; // If true, required attribute can be mapped more than once
  requireProvided?: boolean; // If true, user always has to be select a provided attribute (this will be enforced by a dialog if needed)
  addMappingInterceptor?: (mappingPair: MappingPair) => Promise<MappingPair[]>; // Function that is executed on every change of the internal mapping pairs. It can return new mapping pairs generated from the current state
  mappingPairs: MappingPair[];
  onMappingPairsChange?: (mappingPairs: MappingPair[]) => void;
  required: 'source' | 'target';
  sourceSchema?: Record<string, Schema>;
  targetSchema?: Record<string, Schema>;
}
function MappingContainer(props: MappingContainerProps): ReactElement {
  const {
    title,
    strict,
    noMixed = false,
    allowMultiMapping = false,
    requireProvided = false,
    mappingPairs,
    onMappingPairsChange = () => {},
    addMappingInterceptor = () => [],
    sourceSchema,
    targetSchema,
    required,
  } = props;

  const [expanded, setExpanded] = useState<boolean>(false);

  // #region Contexts
  const {
    mappingState: {
      mappingPairs: internalMappingPairs,
      providedSelection,
      requiredSelection,
    },
    dispatch,
  } = useContext(MappingContext);
  // #endregion

  // #region Mapping Association prompt
  // This is required for asyncApi mapping sif th user wants to set a required attribute to a static value
  const [openPrompt, Prompt] = usePrompt<
    string,
    React.ComponentProps<typeof ApiAssociationPrompt>,
    typeof ApiAssociationPrompt
  >(ApiAssociationPrompt);
  // #endregion

  // #region Create mapping pair
  useEffect(() => {
    async function handleSelectionChange() {
      if (!requiredSelection) {
        return;
      }

      let finalProvidedSelection = providedSelection;
      // Require the user to select a provided interface if it is a requirement and there is no selection done yet
      if (
        requireProvided &&
        (!providedSelection || providedSelection.length === 0)
      ) {
        // If we only have one target, there is no need to ask the user
        const targetSchemaKeys = Object.keys(targetSchema ?? {});
        if (targetSchemaKeys.length === 1) {
          finalProvidedSelection = targetSchemaKeys;
        } else {
          const selection = await openPrompt();

          // User aborted, early return
          if (!selection) {
            dispatch({
              type: 'clearProvided',
            });
            dispatch({
              type: 'clearRequired',
            });
            return;
          }

          finalProvidedSelection = [selection];
        }
      }

      const mappingPair: MappingPair = {
        creationType: MappingPairType.MANUAL,
        requiredAttributeId: requiredSelection,
        providedAttributeIds: finalProvidedSelection ?? [],
        mappingTransformation:
          providedSelection?.length === 1
            ? escapeJsonata(providedSelection[0])
            : '',
      };

      // Get additional attribute mappings
      const additionalMappingPairs = await addMappingInterceptor(mappingPair);
      const currentMappingPairs = [...internalMappingPairs, mappingPair];
      const currentMappingPairAttributeIds = currentMappingPairs.map(
        (mP) => mP.requiredAttributeId,
      );

      // Filter out all already existing mapping pairs
      const filteredMappingPairs = additionalMappingPairs.filter((mP) => {
        return !currentMappingPairAttributeIds.includes(mP.requiredAttributeId);
      });

      dispatch({
        type: 'addMappingPair',
        payload: {
          mappingPair: [...filteredMappingPairs, mappingPair],
        },
      });

      dispatch({
        type: 'clearProvided',
      });
      dispatch({
        type: 'clearRequired',
      });
    }

    handleSelectionChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredSelection]);
  // #endregion

  // #region Populate context
  useEffect(
    () =>
      dispatch({
        type: 'setMappingPairs',
        payload: {
          mappingPairs,
        },
      }),
    [mappingPairs, dispatch],
  );

  useEffect(
    () =>
      dispatch({
        type: 'setStrict',
        payload: {
          strict,
        },
      }),
    [strict, dispatch],
  );
  // #endregion

  // #region Change handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onMappingPairsChange(internalMappingPairs), [
    internalMappingPairs,
  ]);

  useEffect(() => {
    if (!strict) {
      // Ignore the falling edge
      return;
    }

    // Reset changes to automatic mappings
    const manualMappings = internalMappingPairs.filter((mappingPair) => {
      // maintain all manual mappings except if they would overwrite an existing automatic mapping
      return (
        mappingPair.creationType === MappingPairType.MANUAL &&
        !mappingPairs.some(
          (mP) => mP.requiredAttributeId === mappingPair.requiredAttributeId,
        )
      );
    });

    const restoredMappingPairs = [...manualMappings, ...mappingPairs];

    dispatch({
      type: 'setMappingPairs',
      payload: {
        mappingPairs: restoredMappingPairs,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strict]);
  // #endregion

  return (
    <>
      <Prompt targetSchema={targetSchema} />

      <button
        type="button"
        className="divider relative mt-4"
        onClick={() => setExpanded((curr) => !curr)}
      >
        {title}
        <ChevronRightIcon
          className={`absolute w-5 h-5 right-4 transition-all transform ${
            expanded ? '-rotate-90' : 'rotate-90'
          } `}
        />
      </button>

      <Collapse isOpened={expanded}>
        <div className="flex mt-4 -mx-1">
          <div className="w-1/4 px-1">
            {sourceSchema && (
              <SchemaTree
                required={required === 'source'}
                noMixed={noMixed}
                allowMultiMapping={allowMultiMapping}
                schema={sourceSchema}
              />
            )}
          </div>

          <div className="w-2/4 px-1">
            <MappingArea />
          </div>

          <div className="w-1/4 px-1">
            {targetSchema && (
              <SchemaTree
                required={required === 'target'}
                noMixed={noMixed}
                allowMultiMapping={allowMultiMapping}
                schema={targetSchema}
              />
            )}
          </div>
        </div>
      </Collapse>
    </>
  );
}

export default MappingContainer;

interface ApiAssociationPromptProps {
  onDismiss?: (data?: string) => void;
  isOpen: boolean;
  targetSchema?: Record<string, Schema>;
}
function ApiAssociationPrompt(props: ApiAssociationPromptProps) {
  const { isOpen, onDismiss = () => {}, targetSchema } = props;

  const targetIdOptions = useMemo(
    () =>
      Object.keys(targetSchema ?? {}).map((key) => ({
        value: key,
        label: key,
      })),
    [targetSchema],
  );

  const [selectedTargetIdOption, setSelectedTargetIdOption] = useState<{
    value: string;
    label: string;
  } | null>(null);

  return (
    <Modal isOpen={isOpen} className="modal flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Select an API</h2>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          onClick={() => onDismiss(undefined)}
        >
          <ClearIcon className="w-5 h-5" />
        </button>
      </div>

      <Select
        className="w-full mt-2"
        value={selectedTargetIdOption}
        onChange={(value) => setSelectedTargetIdOption(value ?? null)}
        options={targetIdOptions}
      />

      <div className="flex-shrink-0 flex mt-2 justify-end">
        <button
          type="button"
          className="button bg-green-800 text-white hover:bg-green-600 disabled:opacity-40 disabled:pointer-events-none"
          onClick={() => onDismiss(selectedTargetIdOption?.value ?? undefined)}
        >
          Select
        </button>
      </div>
    </Modal>
  );
}
