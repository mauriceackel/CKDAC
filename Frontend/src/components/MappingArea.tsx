/* eslint-disable @typescript-eslint/no-use-before-define */
import { MappingContext } from 'contexts/MappingContext';
import { MappingPair, MappingPairType } from 'models/MappingModel';
import React, {
  ReactElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import ChevronRightIcon from './Icons/ChevronRightIcon';
import ClearIcon from './Icons/ClearIcon';
import MappingTransformationEditor from './MappingTransformationEditor';

function MappingArea(): ReactElement {
  const { mappingState } = useContext(MappingContext);
  const { mappingPairs } = mappingState;

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-grow flex-wrap -m-1 content-start overflow-hidden">
        {mappingPairs.map((mappingPair) => (
          <div
            key={
              mappingPair.requiredAttributeId + mappingPair.providedAttributeIds
            }
            className="p-1"
          >
            <MappingPairElement mappingPair={mappingPair} />
          </div>
        ))}
      </div>
      <div className="flex justify-center text-white text-xs border-t border-red-900 pt-2 mt-2">
        <span className="rounded py-1 px-2 mx-1 bg-green-800">Manual</span>
        <span className="rounded py-1 px-2 mx-1 bg-pink-800">Attribute</span>
        <span className="rounded py-1 px-2 mx-1 bg-yellow-700">Transitive</span>
        <span className="rounded py-1 px-2 mx-1 bg-red-600">Error</span>
      </div>
    </div>
  );
}

// #region Mapping element
interface MappingPairElementProps {
  mappingPair: MappingPair;
}
function MappingPairElement(props: MappingPairElementProps): ReactElement {
  const { mappingPair } = props;
  const {
    creationType,
    mappingTransformation,
    providedAttributeIds,
    requiredAttributeId,
  } = mappingPair;

  const { mappingState, dispatch } = useContext(MappingContext);

  const { strict } = mappingState;
  const disabled = useMemo(
    () => strict && mappingPair.creationType !== MappingPairType.MANUAL,
    [strict, mappingPair],
  );

  const [editorOpen, setEditorOpen] = useState<boolean>(false);

  // #region Separate name and path
  const [requiredAttributeName] = useMemo(() => {
    const lastDot = requiredAttributeId.lastIndexOf('.');
    return [
      requiredAttributeId.substr(lastDot + 1),
      requiredAttributeId.substring(0, lastDot),
    ];
  }, [requiredAttributeId]);

  const clusteredProvidedAttributes = useMemo(() => {
    const separatedIds = providedAttributeIds.map((attributeId) => {
      const lastDot = attributeId.lastIndexOf('.');
      return [
        attributeId.substr(lastDot + 1),
        attributeId.substring(0, lastDot),
      ];
    });

    // Cluster attribute names by attribute paths
    const clustered = separatedIds.reduce<Record<string, string[]>>(
      (cluster, [attributeId, attributePath]) => {
        return {
          ...cluster,
          [attributePath]: [...(cluster[attributePath] ?? []), attributeId],
        };
      },
      {},
    );

    return clustered;
  }, [providedAttributeIds]);
  // #endregion

  // #region Element color
  const colorClass = useMemo(() => {
    if (mappingTransformation.length === 0) {
      return 'bg-red-600';
    }

    switch (creationType) {
      case MappingPairType.MANUAL:
        return 'bg-green-800';
      case MappingPairType.ATTRIBUTE:
        return 'bg-pink-800';
      case MappingPairType.MAPPING:
        return 'bg-yellow-700';
      case MappingPairType.SYNTAX:
        return 'bg-gray-800';
      default:
        return 'bg-red-600';
    }
  }, [creationType, mappingTransformation]);
  // #endregion

  // #region Hover events
  const handleMouseEnter = useCallback(
    () =>
      dispatch({
        type: 'hover',
        payload: {
          hoveredMappingPair: mappingPair,
        },
      }),
    [mappingPair, dispatch],
  );

  const handleMouseLeave = useCallback(
    () =>
      dispatch({
        type: 'hover',
        payload: {
          hoveredMappingPair: undefined,
        },
      }),
    [dispatch],
  );
  // #endregion

  // #region Mapping pair functions
  const removeMappingPair = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();

      if (disabled) {
        return;
      }

      dispatch({
        type: 'removeMappingPair',
        payload: {
          mappingPair,
        },
      });

      handleMouseLeave();
    },
    [disabled, dispatch, handleMouseLeave, mappingPair],
  );

  const handleMappingTransformationUpdate = useCallback(
    (transformation?: string) => {
      setEditorOpen(false);

      if (!disabled && transformation !== undefined) {
        dispatch({
          type: 'updateMappingPair',
          payload: {
            mappingPair,
            data: {
              mappingTransformation: transformation,
            },
          },
        });
      }
    },
    [disabled, dispatch, mappingPair],
  );
  // #endregion

  return (
    <>
      <MappingTransformationEditor
        disabled={disabled}
        isOpen={editorOpen}
        mappingPair={mappingPair}
        onDismiss={handleMappingTransformationUpdate}
      />
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={`hoverable button flex items-center relative cursor-pointer ${colorClass} text-white`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setEditorOpen(true)}
      >
        {!disabled && (
          <button
            type="button"
            className="z-10 bg-gray-600 text-white absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center show-hover"
            onClick={removeMappingPair}
          >
            <ClearIcon className="w-3 h-3" />
          </button>
        )}

        <div>
          {Object.keys(clusteredProvidedAttributes).length === 0
            ? mappingPair.mappingTransformation
            : Object.values(clusteredProvidedAttributes).map((ids) => (
                <div key={ids.toString()} className="flex flex-col">
                  {ids.map((id) => (
                    <p key={id}>{id}</p>
                  ))}
                </div>
              ))}
        </div>

        <ChevronRightIcon className="w-4 h-4 mx-2" />

        <div>{requiredAttributeName}</div>
      </div>
    </>
  );
}
// #endregion

export default MappingArea;
