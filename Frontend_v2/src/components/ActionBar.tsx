import React, { ReactElement } from 'react';
import CheckIcon from './Icons/CheckIcon';
import Spinner from './Spinner';

interface ActionBarProps {
  mappingValid: boolean;
  saving: boolean;
  adapterCreating: boolean;
  strict: boolean;
  toggleStrict: () => void;
  onClear: () => void;
  onSave: () => void;
  onCreateAdapter: () => void;
}
function ActionBar(props: ActionBarProps): ReactElement {
  const {
    mappingValid,
    saving,
    adapterCreating,
    strict,
    toggleStrict,
    onClear,
    onSave,
    onCreateAdapter,
  } = props;

  return (
    <div className="mt-6 flex">
      <label
        htmlFor="cbx-strict"
        className="flex mr-2 items-center button checkbox bg-yellow-600 text-white cursor-pointer"
      >
        <div className="w-6 h-6 mr-2 rounded border">
          {strict && <CheckIcon className="w-6 h-6" />}
        </div>
        <input
          id="cbx-strict"
          type="checkbox"
          className="hidden"
          checked={strict}
          readOnly
          onClick={toggleStrict}
        />
        Strict Mode
      </label>
      <button
        type="button"
        className="mr-2 button hover:bg-red-600 hover:text-white"
        onClick={onClear}
      >
        Clear
      </button>
      <div className="flex-1" />
      <button
        type="button"
        disabled={adapterCreating}
        className="mr-2 inline-flex items-center button bg-gray-900 text-white disabled:opacity-40"
        onClick={onCreateAdapter}
      >
        {adapterCreating ? (
          <>
            <Spinner />
            Creating...
          </>
        ) : (
          'Create Adapter'
        )}
      </button>
      <button
        type="button"
        disabled={saving || !strict || !mappingValid}
        className="button inline-flex items-center bg-green-800 text-white disabled:opacity-40"
        onClick={onSave}
      >
        {saving ? (
          <>
            <Spinner />
            Creating...
          </>
        ) : (
          'Create Mapping'
        )}
      </button>
    </div>
  );
}

export default ActionBar;
