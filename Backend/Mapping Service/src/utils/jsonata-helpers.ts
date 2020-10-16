export type KeyChain = Array<string>;

export const operatorsRegex = /(=|!|\+|-|\*|\/|>|<|\sand\s|\sor\s|\sin\s|&|%)(?!((\w|-)*?"$)|((\w|-)*?"\."))/g;

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


const escapeRegex = /(^\d.*)|(-)/;
/**
 * Helper to escape an identifyer (i.e. enclose in $."")
 * 
 */
export function buildJSONataKey(keyChain: KeyChain): string {
    const needsEscaping = keyChain.some(k => escapeRegex.test(k));
    if (!needsEscaping) {
        return keyChain.join('.');
    }
    return `$.${keyChain.map(k => `"${k}"`).join('.')}`;
}
