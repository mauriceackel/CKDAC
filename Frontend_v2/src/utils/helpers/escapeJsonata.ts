const escapeRegex = /(^\d.*)|(-)/;

/**
 * Helper to escape an identifier (i.e. enclose in $."")
 */
function escapeJsonata(key: string): string {
  const keyElements = key.split('.');
  const needsEscaping = keyElements.some((k) => escapeRegex.test(k));

  if (!needsEscaping) {
    return key;
  }
  return `$.${keyElements.map((k) => `"${k}"`).join('.')}`;
}

export default escapeJsonata;
