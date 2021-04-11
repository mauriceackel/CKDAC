import { MappingPair } from 'models/MappingModel';
import React, {
  PropsWithChildren,
  ReactElement,
  useMemo,
  useReducer,
} from 'react';

// #region Types
type MappingState = {
  strict: boolean;
  mappingPairs: MappingPair[];
  hoveredMappingPair?: MappingPair;
  providedSelection?: string[];
  requiredSelection?: string;
};

type HoverAction = {
  type: 'hover';
  payload: {
    hoveredMappingPair: MappingPair | undefined;
  };
};
type SetStrictAction = {
  type: 'setStrict';
  payload: {
    strict: boolean;
  };
};
type SetMappingPairsAction = {
  type: 'setMappingPairs';
  payload: {
    mappingPairs: MappingPair[];
  };
};
type AddMappingPairAction = {
  type: 'addMappingPair';
  payload: {
    mappingPair: MappingPair | MappingPair[];
  };
};
type UpdateMappingPairAction = {
  type: 'updateMappingPair';
  payload: {
    mappingPair: MappingPair;
    data: Partial<MappingPair>;
  };
};
type RemoveMappingPairAction = {
  type: 'removeMappingPair';
  payload: {
    mappingPair: MappingPair;
  };
};
type ToggleProvidedAction = {
  type: 'toggleProvided';
  payload: {
    attributeId: string;
  };
};
type ClearProvidedAction = {
  type: 'clearProvided';
};
type SelectRequiredAction = {
  type: 'selectRequired';
  payload: {
    attributeId: string;
  };
};
type ClearRequiredAction = {
  type: 'clearRequired';
};

type MappingStateAction =
  | HoverAction
  | SetStrictAction
  | SetMappingPairsAction
  | AddMappingPairAction
  | UpdateMappingPairAction
  | RemoveMappingPairAction
  | ToggleProvidedAction
  | ClearProvidedAction
  | SelectRequiredAction
  | ClearRequiredAction;
// #endregion

// #region Context
const initialState: MappingState = {
  strict: true,
  mappingPairs: [],
  hoveredMappingPair: undefined,
};

export const MappingContext = React.createContext<{
  mappingState: MappingState;
  dispatch: React.Dispatch<MappingStateAction>;
}>({
  mappingState: initialState,
  dispatch: () => {},
});
// #endregion

// #region Reducer
function mappingReducer(
  currentState: MappingState,
  action: MappingStateAction,
): MappingState {
  switch (action.type) {
    case 'hover': {
      return {
        ...currentState,
        hoveredMappingPair: action.payload.hoveredMappingPair,
      };
    }
    case 'setStrict': {
      return {
        ...currentState,
        strict: action.payload.strict,
      };
    }
    case 'setMappingPairs': {
      return {
        ...currentState,
        mappingPairs: action.payload.mappingPairs,
      };
    }
    case 'addMappingPair': {
      if (Array.isArray(action.payload.mappingPair)) {
        return {
          ...currentState,
          mappingPairs: [
            ...currentState.mappingPairs,
            ...action.payload.mappingPair,
          ],
        };
      }

      return {
        ...currentState,
        mappingPairs: [
          ...currentState.mappingPairs,
          action.payload.mappingPair,
        ],
      };
    }
    case 'updateMappingPair': {
      return {
        ...currentState,
        mappingPairs: currentState.mappingPairs.map((mappingPair) => {
          if (mappingPair !== action.payload.mappingPair) {
            return mappingPair;
          }

          return {
            ...mappingPair,
            ...action.payload.data,
          };
        }),
      };
    }
    case 'removeMappingPair': {
      return {
        ...currentState,
        mappingPairs: currentState.mappingPairs.filter(
          (mappingPair) => mappingPair !== action.payload.mappingPair,
        ),
      };
    }
    case 'toggleProvided': {
      const included = currentState.providedSelection?.includes(
        action.payload.attributeId,
      );

      const newSelection = included
        ? currentState.providedSelection?.filter(
            (attributeId) => attributeId !== action.payload.attributeId,
          )
        : [
            ...(currentState.providedSelection ?? []),
            action.payload.attributeId,
          ];

      return {
        ...currentState,
        providedSelection: newSelection,
      };
    }
    case 'clearProvided': {
      return {
        ...currentState,
        providedSelection: undefined,
      };
    }
    case 'selectRequired': {
      return {
        ...currentState,
        requiredSelection: action.payload.attributeId,
      };
    }
    case 'clearRequired': {
      return {
        ...currentState,
        requiredSelection: undefined,
      };
    }
    default:
      throw new Error('Unknown mapping action');
  }
}

// #endregion

// #region Provider
type MappingContextProviderProps = PropsWithChildren<unknown>;
export function MappingContextProvider(
  props: MappingContextProviderProps,
): ReactElement {
  const { children } = props;
  const [mappingState, dispatch] = useReducer(mappingReducer, initialState);

  const value = useMemo(() => ({ mappingState, dispatch }), [
    mappingState,
    dispatch,
  ]);

  return (
    <MappingContext.Provider value={value}>{children}</MappingContext.Provider>
  );
}
// #endregion
