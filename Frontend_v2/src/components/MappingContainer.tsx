import { MappingContext } from 'contexts/MappingContext';
import { MappingPair, MappingPairType } from 'models/MappingModel';
import React, { ReactElement, useContext, useState, useEffect } from 'react';
import { Collapse } from 'react-collapse';
import escapeJsonata from 'utils/helpers/escapeJsonata';
import { Schema } from 'utils/helpers/swaggerParser';
import ChevronRightIcon from './Icons/ChevronRightIcon';
import MappingArea from './MappingArea';
import SchemaTree from './SchemaTree';

interface MappingContainerProps {
  title: string;
  strict: boolean;
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
    mappingPairs,
    onMappingPairsChange = () => {},
    sourceSchema,
    targetSchema,
    required,
  } = props;

  const {
    mappingState: {
      mappingPairs: internalMappingPairs,
      providedSelection,
      requiredSelection,
    },
    dispatch,
  } = useContext(MappingContext);

  const [expanded, setExpanded] = useState<boolean>(false);

  // #region Create mapping pair
  useEffect(() => {
    if (!requiredSelection) {
      return;
    }

    const mappingPair: MappingPair = {
      creationType: MappingPairType.MANUAL,
      requiredAttributeId: requiredSelection,
      providedAttributeIds: providedSelection ?? [],
      mappingTransformation:
        providedSelection?.length === 1
          ? escapeJsonata(providedSelection[0])
          : '',
    };

    dispatch({
      type: 'addMappingPair',
      payload: {
        mappingPair,
      },
    });

    dispatch({
      type: 'clearProvided',
    });
    dispatch({
      type: 'clearRequired',
    });
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
