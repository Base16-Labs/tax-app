/**
 * What the app remembers between launches: the chosen country, each country's
 * inputs, and the appearance.
 *
 * expo-sqlite's key-value store has a synchronous API, so saved values are read
 * before the first render and the app never flashes its defaults first. Storage
 * failing is never fatal: the app falls back to defaults and carries on.
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
    // Not saved this time; the in-memory state is still right.
  }
}
