
export function toTree(jsonObject: any, keyChain: Array<string> = []): JsonTreeNode[] {
  if (jsonObject && typeof jsonObject === "object" && !(jsonObject instanceof Array)) {
    return Object.keys(jsonObject).map(key => {
      const kChain = new Array<string>(...keyChain, key);

      return {
        name: key,
        keyChain: kChain,
        children: toTree(jsonObject[key], kChain)
      }
    });
  }
  return [];
}

export interface JsonTreeNode {
  name: string;
  keyChain: KeyChain;
  children?: JsonTreeNode[];
}

export type KeyChain = Array<string>;
