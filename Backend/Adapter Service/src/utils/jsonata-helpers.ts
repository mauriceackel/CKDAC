export type KeyChain = Array<string>;

/**
 * Method that takes a stringified JSON object as input and removes the quotes of all string properties.
 *
 * Exmaple:
 * { "foo":"bar" } --> { "foo":bar }
 */
export function stringifyedToJsonata(obj: string) {
    const keyValueRegex = /(?:\"|\')([^"]*)(?:\"|\')(?=:)(?:\:\s*)(?:\"|\')?(true|false|(?:[^"]|\\\")*)(?:"(?=\s*(,|})))/g;
    return obj.replace(keyValueRegex, '"$1":$2').replace(/\\\"/g, '"');
}

export function escapeQuote(input: string) {
    return input.replace(/"/g, "\\\"")
  }
  