/* eslint-disable @typescript-eslint/ban-types */
import type { ObjectTypes, Primitive, PrimitiveTypes } from './types';

export const objectTypes = [
  'Array',
  'ArrayBuffer',
  'AsyncFunction',
  'AsyncGenerator',
  'AsyncGeneratorFunction',
  'Date',
  'Error',
  'Function',
  'Generator',
  'GeneratorFunction',
  'HTMLElement',
  'Map',
  'Object',
  'Promise',
  'RegExp',
  'Set',
  'WeakMap',
  'WeakSet',
] as const;

export const primitiveTypes = [
  'bigint',
  'boolean',
  'null',
  'number',
  'string',
  'symbol',
  'undefined',
] as const;

export function getObjectType(value: unknown): ObjectTypes | undefined {
  const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);

  if (/HTML\w+Element/.test(objectTypeName)) {
    return 'HTMLElement';
  }

  if (isObjectType(objectTypeName)) {
    return objectTypeName;
  }

  return undefined;
}

export function isObjectOfType<T>(type: string) {
  return (value: unknown): value is T => getObjectType(value) === type;
}

export function isObjectType(name: unknown): name is ObjectTypes {
  return objectTypes.includes(name as ObjectTypes);
}

export function isOfType<T extends Primitive | Function>(type: string) {
  // eslint-disable-next-line valid-typeof
  return (value: unknown): value is T => typeof value === type;
}

export function isPrimitiveType(name: unknown): name is PrimitiveTypes {
  return primitiveTypes.includes(name as PrimitiveTypes);
}
