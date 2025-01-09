declare const objectTypes: readonly ["Array", "ArrayBuffer", "AsyncFunction", "AsyncGenerator", "AsyncGeneratorFunction", "Date", "Error", "Function", "Generator", "GeneratorFunction", "HTMLElement", "Map", "Object", "Promise", "RegExp", "Set", "WeakMap", "WeakSet"];
declare const primitiveTypes: readonly ["bigint", "boolean", "null", "number", "string", "symbol", "undefined"];

type Class<T = unknown> = new (...arguments_: any[]) => T;
type ObjectTypes = (typeof objectTypes)[number];
type PlainObject = Record<number | string | symbol, unknown>;
type Primitive = null | undefined | string | number | boolean | symbol | bigint;
type PrimitiveTypes = (typeof primitiveTypes)[number];
type TypeName = ObjectTypes | PrimitiveTypes;

export type { Class as C, PlainObject as P, TypeName as T, Primitive as a };
