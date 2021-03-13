import { MappingPair } from 'models/MappingModel';
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Modal from 'react-modal';
import escapeJsonata from 'utils/helpers/escapeJsonata';
import ClearIcon from './Icons/ClearIcon';

Modal.setAppElement('#root');

interface MappingTransformationEditorProps {
  isOpen: boolean;
  disabled?: boolean;
  onDismiss: (transformation?: string) => void;
  mappingPair: MappingPair;
}
function MappingTransformationEditor(
  props: MappingTransformationEditorProps,
): ReactElement {
  const { isOpen, onDismiss, mappingPair, disabled = false } = props;

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [mappingTransformation, setMappingTransformation] = useState<string>(
    mappingPair.mappingTransformation,
  );

  useEffect(() => setMappingTransformation(mappingPair.mappingTransformation), [
    mappingPair,
  ]);

  // #region Handle interaction
  const cancel = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();
      setMappingTransformation(mappingPair.mappingTransformation);
      onDismiss();
    },
    [mappingPair, onDismiss],
  );

  const save = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();

      if (disabled) {
        return;
      }

      onDismiss(mappingTransformation);
      setMappingTransformation(mappingPair.mappingTransformation);
    },
    [disabled, mappingTransformation, mappingPair, onDismiss],
  );
  // #endregion

  return (
    <Modal
      isOpen={isOpen}
      className="transformation-editor-modal flex flex-col"
    >
      <div className="flex-shrink-0 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edit Mapping</h2>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          onClick={cancel}
        >
          <ClearIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 mt-4 flex">
        <div className="w-1/3 flex flex-col mr-2">
          <p className="text-lg">Available Attributes</p>
          {mappingPair.providedAttributeIds.map((attributeId) => {
            const [attributeName] = attributeId.split('.').slice(-1);

            return (
              <button
                key={attributeId}
                disabled={disabled}
                type="button"
                className="button hover:bg-gray-200 overflow-hidden overflow-ellipsis text-left mb-1 disabled:opacity-40 disabled:pointer-events-none"
                onClick={() =>
                  setMappingTransformation((current) => {
                    const cursorPosition =
                      textAreaRef.current?.selectionStart ?? current.length;

                    const beginning = current.substring(0, cursorPosition);
                    const end = current.substr(cursorPosition);
                    return beginning + escapeJsonata(attributeId) + end;
                  })
                }
              >
                {attributeName}
              </button>
            );
          })}
        </div>
        <textarea
          ref={textAreaRef}
          disabled={disabled}
          className="w-2/3 focus:outline-none rounded border"
          value={mappingTransformation}
          onChange={(e) => setMappingTransformation(e.currentTarget.value)}
        />
      </div>

      <div className="flex-shrink-0 flex mt-2 justify-end">
        <button
          type="button"
          className="button hover:bg-red-600 hover:text-white mr-2"
          onClick={cancel}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={disabled}
          className="button bg-green-800 text-white hover:bg-green-600 disabled:opacity-40 disabled:pointer-events-none"
          onClick={save}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

export default MappingTransformationEditor;
