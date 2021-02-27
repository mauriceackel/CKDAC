import { Document } from "mongoose";
import { ApiType } from "../models/ApiModel";
import { IMapping, Mapping, MappingDirection } from "../models/MappingModel";

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
export async function treeSearch(apiType: ApiType, sourceId: string, finalTragetId: string, direction: MappingDirection | undefined, visitedApis: Array<string> = []): Promise<Tree<IMapping & Document>[]> {
    //From all mappings, get the ones that match the source ID and that have not yet been visited
    const query = apiType === ApiType.ASYNC_API ? { apiType: apiType, direction, sourceId: sourceId } : { apiType: apiType, sourceId: sourceId };
    const sources = await Mapping.find(query);

    const result: Tree<IMapping & Document>[] = [];
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
                const children = await treeSearch(apiType, targetId, finalTragetId, direction, [...visitedApis, sourceId]);
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