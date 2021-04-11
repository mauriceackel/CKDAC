export function buildNodes(jsonObject: any, parentKey = ''): JsonTreeNode[] {
  if (
    jsonObject &&
    typeof jsonObject === 'object' &&
    !Array.isArray(jsonObject)
  ) {
    return Object.keys(jsonObject).map((key) => {
      const flattenedKey = `${parentKey}${parentKey ? '.' : ''}${key}`;

      return {
        name: key,
        key: flattenedKey,
        children: buildNodes(jsonObject[key], flattenedKey),
      };
    });
  }

  return [];
}

export interface JsonTreeNode {
  name: string;
  key: string;
  children?: JsonTreeNode[];
}

export type KeyChain = Array<string>;
