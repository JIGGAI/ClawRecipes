/**
 * Credential storage for Basic Auth. Stores the Base64 value for
 * Authorization: Basic <value> (btoa("user:password")). Base64 is easily
 * decoded, so treat stored credentials as sensitive—XSS could steal them.
 */

const STORAGE_KEY = "kitchen-auth";

let memoryValue: string | undefined;

function getFromStorage(): string | undefined {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function getAuthHeader(): string | undefined {
  if (memoryValue !== undefined) return memoryValue;
  return getFromStorage();
}

export function setAuthHeader(value: string): void {
  memoryValue = value;
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function clear(): void {
  memoryValue = undefined;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
