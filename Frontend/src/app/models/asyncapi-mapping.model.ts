import { IMapping, MappingDirection } from './mapping.model';

export interface IAsyncApiMapping extends IMapping {
  direction: MappingDirection //If input, source & targets are subscribers. If output, providers.
  topics: {
    source: string,
    targets: { [targetId: string]: string }
  }
  servers: {
    source: string,
    targets: { [targetId: string]: string }
  }
  // The key is the id of the target
  messageMappings: { [key: string]: string } //JSONata mappings
}
