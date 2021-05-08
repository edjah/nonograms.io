declare module "*.css";

/** These are returned by new Date().toISOString(). Example: "2021-05-07T07:54:38.072Z" */
declare type DateTimeIsoString = string;

/** Millisecond level timestamp. These are returned by Date.now(). Example: 1620469450517 */
declare type TimestampMs = number;

/** Colors are hex strings. Example: "#aabbcc" */
declare type Color = string;

declare type UserId = string;

declare type FlattenType<T> = Identity<{ [K in keyof T]: T[K] }>;
type Identity<T> = T;
