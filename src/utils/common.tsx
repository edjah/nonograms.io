import lodashDeepClone from "lodash/cloneDeep";
import lodashDeepEqual from "lodash/isEqual";

export type DateTimeIsoString = string;

export function randInt(lowInclusive: number, highExclusive: number) {
  const r = Math.random() * (highExclusive - lowInclusive);
  return Math.floor(lowInclusive + r);
}

export function round(num: number, digits: number = 0): number {
  return parseFloat(num.toFixed(digits));
}

export function assert(value: unknown): asserts value {
  if (!value) {
    throw new Error(`Assertion failed : ${value}`);
  }
}

export function deepClone<T>(obj: T): T {
  return lodashDeepClone(obj);
}

export function deepEqual(left: unknown, right: unknown): boolean {
  return lodashDeepEqual(left, right);
}

export function setTimeoutAsync(duration: number): Promise<void> {
  return new Promise((cb) => setTimeout(cb, duration));
}

/** This will generate a cryptographically secure random hex string. */
export function generateRandomHexString(length: number) {
  assert(length > 0 && length <= 128 && length % 2 === 0);
  const randomBytes = crypto.getRandomValues(new Uint8Array(length / 2));
  return Array.prototype.map
    .call(randomBytes, (byte) => ("0" + byte.toString(16)).substr(-2))
    .join("");
}
