/* eslint-disable @typescript-eslint/no-use-before-define */
import { MappingContext } from 'contexts/MappingContext';
import React, { ReactElement, useMemo, useState, useContext } from 'react';
import { Collapse } from 'react-collapse';
import { Schema } from 'utils/helpers/schemaHelpers';
import { buildNodes, JsonTreeNode } from 'utils/helpers/toTree';
import ChevronRightIcon from './Icons/ChevronRightIcon';

interface SchemaTreeProps {
  required: boolean; // If true, this is the required side
  noMixed?: boolean; // If true, provided attributes have to be from the same api
  allowMultiMapping?: boolean; // If true, required attribute can be mapped more than once
  schema: Record<string, Schema>;
}
function SchemaTree(props: SchemaTreeProps): ReactElement {
  const {
    schema,
    required,
    noMixed = false,
    allowMultiMapping = false,
  } = props;
  const nodes = useMemo(() => buildNodes(schema), [schema]);

  return (
    <div>
      {nodes.map((node) => (
        <TreeNode
          key={node.key}
          node={node}
          noMixed={noMixed}
          allowMultiMapping={allowMultiMapping}
          required={required}
        />
      ))}
    </div>
  );
}

// #region Tree node
interface TreeNodeProps {
  required: boolean;
  noMixed: boolean;
  allowMultiMapping: boolean;
  node: JsonTreeNode;
}
function TreeNode(props: TreeNodeProps): ReactElement {
  const { required, noMixed, allowMultiMapping, node } = props;

  const [expanded, setExpanded] = useState(true);
  const { mappingState, dispatch } = useContext(MappingContext);
  const {
    hoveredMappingPair,
    providedSelection,
    requiredSelection,
    mappingPairs,
  } = mappingState;

  // #region Compute state
  const disabled = useMemo(() => {
    const alreadyMapped =
      required &&
      !allowMultiMapping &&
      mappingPairs.some(
        (mappingPair) => mappingPair.requiredAttributeId === node.key,
      );

    const [apiId] = node.key.split('_');
    const notMixable =
      noMixed &&
      !required && // Only relevant for provider side as we can only du multi-select here
      (providedSelection?.some((id) => !id.startsWith(apiId)) ?? false);

    return alreadyMapped || notMixable;
  }, [
    mappingPairs,
    noMixed,
    node.key,
    providedSelection,
    required,
    allowMultiMapping,
  ]);

  const highlighted = useMemo(() => {
    if (hoveredMappingPair === undefined) {
      return false;
    }

    return (
      hoveredMappingPair.requiredAttributeId === node.key ||
      hoveredMappingPair.providedAttributeIds.includes(node.key)
    );
  }, [hoveredMappingPair, node]);

  const selected = useMemo(() => {
    if (required) {
      return requiredSelection === node.key;
    }

    return providedSelection?.includes(node.key) ?? false;
  }, [required, requiredSelection, providedSelection, node]);

  const hasChildren = useMemo(() => node.children && node.children.length > 0, [
    node,
  ]);
  // #endregion

  function handleClick() {
    if (hasChildren) {
      setExpanded((curr) => !curr);
      return;
    }

    dispatch({
      type: required ? 'selectRequired' : 'toggleProvided',
      payload: {
        attributeId: node.key,
      },
    });
  }

  return (
    <>
      <div className="flex items-center">
        {hasChildren && (
          <ChevronRightIcon
            className={`flex-shrink-0 w-4 h-4 transform transition-all duration-150 ${
              expanded ? 'rotate-90' : 'rotate-0'
            }`}
          />
        )}
        <button
          type="button"
          disabled={disabled}
          className={`overflow-hidden overflow-ellipsis rtl text-right button transition-all ${
            selected ? 'text-red-900 font-bold' : ''
          } ${highlighted ? 'bg-red-200' : ''} ${
            disabled ? 'text-black text-opacity-30' : 'hover:bg-gray-200'
          }`}
          onClick={handleClick}
        >
          {node.name}
        </button>
      </div>
      {node.children && (
        <div className="ml-4">
          <Collapse isOpened={expanded}>
            {node.children?.map((childNode) => (
              <TreeNode
                key={childNode.key}
                node={childNode}
                noMixed={noMixed}
                allowMultiMapping={allowMultiMapping}
                required={required}
              />
            ))}
          </Collapse>
        </div>
      )}
    </>
  );
}
// #endregion

export default SchemaTree;
