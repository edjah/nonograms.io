import lodashDeepClone from "lodash/cloneDeep";
import lodashDeepEqual from "lodash/isEqual";

export function randInt(lowInclusive: number, highExclusive: number) {
  const r = Math.random() * (highExclusive - lowInclusive);
  return Math.floor(lowInclusive + r);
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
