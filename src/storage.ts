/**
 * Persisted country, per-country inputs and appearance.
 * expo-sqlite's kv store is synchronous, so values are read before first render.
 */
import Storage from 'expo-sqlite/kv-store';

const PREFIX = 'takehome:v1:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = Storage.getItemSync(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    if (value === undefined || value === null) Storage.removeItemSync(PREFIX + key);
    else Storage.setItemSync(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore write failures; the in-memory state is still correct.
  }
}
