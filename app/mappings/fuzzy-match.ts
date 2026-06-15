export const fuzzyMatch = (query: string, target: string): boolean => {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const queryLength = q.length;
  const targetLength = t.length;

  if (queryLength > targetLength) {
    return false;
  }

  let queryIndex = 0;

  for (let targetIndex = 0; targetIndex < targetLength && queryIndex < queryLength; targetIndex++) {
    if (t[targetIndex] === q[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === queryLength;
};
