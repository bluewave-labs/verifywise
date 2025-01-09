import { objectTypes, primitiveTypes } from './helpers';

export type Class<T = unknown> = new (...arguments_: any[]) => T;
export type ObjectTypes = (typeof objectTypes)[number];
export type PlainObject = Record<number | string | symbol, unknown>;
export type Primitive = null | undefined | string | number | boolean | symbol | bigint;
export type PrimitiveTypes = (typeof primitiveTypes)[number];
export type TypeName = ObjectTypes | PrimitiveTypes;
