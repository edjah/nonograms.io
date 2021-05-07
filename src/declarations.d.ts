declare module "*.css";

/** Example: "2021-05-07T07:54:38.072Z" */
declare type DateTimeIsoString = string;

/** Colors are hex strings. Example: "#aabbcc" */
declare type Color = string;

declare type UserId = string;

declare type FlattenType<T> = Identity<{ [K in keyof T]: T[K] }>;
type Identity<T> = T;
