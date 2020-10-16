import { IMappingPair } from '../models/mapping.model';
import { unflatten } from 'flat';
import * as getinputs from '../utils/get-inputs/get-inputs';

/**
 * Creates a JSONata mapping from an array of mapping pairs
 * @param mappingPairs A list of mapping pairs that will build the transformation
 */
export function mappingPairsToTrans(mappingPairs: Array<IMappingPair>) {
  return unflatten(mappingPairs.reduce((obj, p) => {
    obj[p.required.join('.')] = p.mappingCode;
    return obj;
  }, {}));
}

/**
 * Creates an array of mapping pairs from an jsonata input
 * @param transformation The JSONata transformation as object
 */
export function transToMappingPairs(transformation: { [key: string]: any }, keyChain: Array<string> = []): Array<IMappingPair> {
  const result = new Array<IMappingPair>();

  for (const key in transformation) {
    if (typeof transformation[key] === "object" && !(transformation[key] instanceof Array)) {
      result.push(...transToMappingPairs(transformation[key], [...keyChain, key]));
    } else {
      const inputs = getinputs(`{"${key}": ${transformation[key]}}`).getInputs({});
      const uniqueInputs = inputs.filter((k, i) => inputs.lastIndexOf(k) === i);
      const pair: IMappingPair = {
        provided: uniqueInputs.map(k => k.split('.')),
        required: [...keyChain, key],
        mappingCode: transformation[key]
      }
      result.push(pair);
    }
  }

  return result;
}
