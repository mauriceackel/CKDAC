import { MappingDirection, MappingPair } from 'models/MappingModel';
import { pairs2Trans } from 'services/mappingservice';

export function clusterMappingPairs(
  mappingPairs: MappingPair[],
  mappingDirection: MappingDirection,
): Record<string, MappingPair[]> {
  // For AsyncApi, we need to build one jsonata mapping for each target.
  // Hence, we need to cluster all mapping pairs that belong to the same target.

  if (mappingDirection === MappingDirection.INPUT) {
    // target is provided
    return mappingPairs.reduce<Record<string, MappingPair[]>>(
      (cluster, mappingPair) => {
        const [apiId] = mappingPair.providedAttributeIds[0].split('.');

        if (
          mappingPair.providedAttributeIds.some((id) => !id.startsWith(apiId))
        ) {
          // Ignore mapping pairs that combine attributes from different target
          // This should never happen due to the restrictions in the mapping container
          return cluster;
        }

        return {
          ...cluster,
          [apiId]: [...(cluster[apiId] ?? []), mappingPair],
        };
      },
      {},
    );
  }

  // target is required
  return mappingPairs.reduce<Record<string, MappingPair[]>>(
    (cluster, mappingPair) => {
      const [apiId] = mappingPair.requiredAttributeId.split('.');

      return {
        ...cluster,
        [apiId]: [...(cluster[apiId] ?? []), mappingPair],
      };
    },
    {},
  );
}

export function computeMessageMapping(
  mappingPairs: MappingPair[],
  mappingDirection: MappingDirection,
): Record<string, string> {
  const clusteredMappingPairs = clusterMappingPairs(
    mappingPairs,
    mappingDirection,
  );

  return Object.entries(clusteredMappingPairs).reduce<Record<string, string>>(
    (mapping, [targetId, mPairs]) => {
      return {
        ...mapping,
        [targetId]: JSON.stringify(pairs2Trans(mPairs)),
      };
    },
    {},
  );
}
