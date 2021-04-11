function stringified2Jsonata(stringifiedMapping: string): string {
  const keyValueRegex = /(?:"|')([^"]*)(?:"|')(?=:)(?::\s*)(?:"|')?(true|false|(?:[^"]|\\")*)(?:"(?=\s*(,|})))/g;
  return stringifiedMapping
    .replace(keyValueRegex, '"$1":$2')
    .replace(/\\"/g, '"');
}

export default stringified2Jsonata;
