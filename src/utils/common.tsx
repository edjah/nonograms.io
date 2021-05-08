import lodashDeepClone from "lodash/cloneDeep";
import lodashDeepEqual from "lodash/isEqual";

export function randInt(lowInclusive: number, highExclusive: number) {
  const r = Math.random() * (highExclusive - lowInclusive);
  return Math.floor(lowInclusive + r);
}

export function randomChoice<T>(items: Array<T>): T {
  return items[randInt(0, items.length)];
}

export function round(num: number, digits: number = 0): number {
  return parseFloat(num.toFixed(digits));
}

export function omit<T extends object, K extends keyof T>(obj: T, key: K): FlattenType<Omit<T, K>> {
  const objClone = { ...obj };
  delete objClone[key];
  return objClone;
}

export function assert(value: unknown): asserts value {
  if (!value) {
    throw new Error(`Assertion failed : ${value}`);
  }
}

export function setTimeoutAsync(duration: number): Promise<void> {
  return new Promise((cb) => setTimeout(cb, duration));
}

/** This will generate a cryptographically secure (probably) random base62 string. */
export function generateRandomBase62String(length: number) {
  const randomBytes = crypto.getRandomValues(new Uint8Array(Math.ceil((length * 6) / 8)));
  const asciiString = Array.prototype.map
    .call(randomBytes, (byte) => String.fromCharCode(byte))
    .join("");
  // TODO: this replace may not be kosher
  return btoa(asciiString).substr(0, length).replace(/\//g, "0").replace(/\+/g, "1");
}

/** This will generate a cryptographically secure random hex string. */
export function generateRandomHexString(length: number) {
  const randomBytes = crypto.getRandomValues(new Uint8Array(length / 2));
  const hexString = Array.prototype.map
    .call(randomBytes, (byte) => ("0" + byte.toString(16)).substr(-2))
    .join("");
  return hexString.substr(0, length);
}

const lastRunTimestampByKey: Record<string, number> = {};

/**
 * This function will return true if the key is not allowed to run because of rate limiting, and
 * false otherwise.
 */
export function isRateLimited(key: string, intervalMs: number): boolean {
  const lastRunTimestamp = lastRunTimestampByKey[key];
  if (lastRunTimestamp && Date.now() < lastRunTimestamp + intervalMs) {
    return true;
  }
  lastRunTimestampByKey[key] = Date.now();
  return false;
}

// Lodash re-exports
export const deepClone = lodashDeepClone;
export const deepEqual = lodashDeepEqual;
