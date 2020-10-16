import { IMapping } from "../models/MappingModel";

export type Tree<T> = { node: T, children?: Tree<T>[] }

/**
   * Finds all paths from a source API to a traget API and builds an acyclic tree as result.
   *
   * Restrictions: In each path, no vertex (i.e. API) is allowed to be visited twice.
   * Implicit restriction: No edge (i.e. Mapping) is allowed to be visited twice (as a result of the prev. restriction)
   *
   * @param sourceId The ID of the starting API
   * @param finalTragetId the ID of the target API
   * @param mappings A list of all existing mappings
   * @param visitedApis A list of APIs (i.e. vertices) that were already visited
   */
export function treeSearch<T extends IMapping>(sourceId: string, finalTragetId: string, mappings: { [key: string]: T[] }, visitedApis: Array<string> = []): Tree<T>[] {
    //From all mappings, get the ones that match the source ID and that have not yet been visited
    const sources = mappings[sourceId] || [];

    const result: Tree<T>[] = [];
    //This double loop makes it so that each 1:n mapping is treated somewhat like a 1:1 mapping
    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        for (let j = 0; j < source.targetIds.length; j++) {
            const targetId = source.targetIds[j];

            if (targetId === finalTragetId) {
                //If one target ID matches our final target API, we add the mapping without any children to the tree
                result.push({ node: source });
            } else if (!(visitedApis.includes(targetId) || sourceId === targetId)) {
                //If the target ID does not yet match the final target, we execute the recursion step, resulting in a DFS
                const children = treeSearch(targetId, finalTragetId, mappings, [...visitedApis, sourceId]);
                //We only add a node to the final tree, if we have found any children that lead to the target. If not, we ignore this branch.
                //This makes it so that in the final tree all leafs end in the target API
                if (children.length > 0) {
                    result.push({ node: source, children: children })
                }
            }
        }
    }

    return result;
}