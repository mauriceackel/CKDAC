export function arrayEquals(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function arrayContainsArray(master, sub) {
  if (master === sub) return true;
  if (master == null || sub == null) return false;
  if (sub.length == 0) return false;

  outer: for(let i = 0; i <= master.length - sub.length; i++) {
    for(let j = 0; j < sub.length; j++) {
      if(master[i + j] !== sub[j]) {
        continue outer;
      }
    }
    return true;
  }
  return false;
}
