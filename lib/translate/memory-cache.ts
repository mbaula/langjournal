const MAX_ENTRIES = 500;

const store = new Map<string, string>();

function touch(key: string, value: string) {
  store.delete(key);
  store.set(key, value);
  while (store.size > MAX_ENTRIES) {
    const first = store.keys().next().value as string | undefined;
    if (first === undefined) break;
    store.delete(first);
  }
}

export function memoryCacheGet(key: string): string | undefined {
  const value = store.get(key);
  if (value === undefined) return undefined;
  touch(key, value);
  return value;
}

export function memoryCacheSet(key: string, value: string) {
  touch(key, value);
}
