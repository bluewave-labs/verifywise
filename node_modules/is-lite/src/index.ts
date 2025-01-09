/* eslint-disable @typescript-eslint/ban-types */
import { getObjectType, isObjectOfType, isOfType, isPrimitiveType } from './helpers';
import type { Class, PlainObject, Primitive, TypeName } from './types';

const DOM_PROPERTIES_TO_CHECK: Array<keyof HTMLElement> = [
  'innerHTML',
  'ownerDocument',
  'style',
  'attributes',
  'nodeValue',
];

function is(value: unknown): TypeName {
  if (value === null) {
    return 'null';
  }

  switch (typeof value) {
    case 'bigint':
      return 'bigint';
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'symbol':
      return 'symbol';
    case 'undefined':
      return 'undefined';
    default:
  }

  if (is.array(value)) {
    return 'Array';
  }

  if (is.plainFunction(value)) {
    return 'Function';
  }

  const tagType = getObjectType(value);

  if (tagType) {
    return tagType;
  }
  /* c8 ignore next 3 */

  return 'Object';
}

is.array = Array.isArray;

is.arrayOf = (target: unknown[], predicate: (v: unknown) => boolean): boolean => {
  if (!is.array(target) && !is.function(predicate)) {
    return false;
  }

  return target.every(d => predicate(d));
};

is.asyncGeneratorFunction = (value: unknown): value is (...arguments_: any[]) => Promise<unknown> =>
  getObjectType(value) === 'AsyncGeneratorFunction';

is.asyncFunction = isObjectOfType<Function>('AsyncFunction');

is.bigint = isOfType<bigint>('bigint');

is.boolean = (value: unknown): value is boolean => {
  return value === true || value === false;
};

is.date = isObjectOfType<Date>('Date');

is.defined = (value: unknown): boolean => !is.undefined(value);

is.domElement = (value: unknown): value is HTMLElement => {
  return (
    is.object(value) &&
    !is.plainObject(value) &&
    (value as HTMLElement).nodeType === 1 &&
    is.string((value as HTMLElement).nodeName) &&
    DOM_PROPERTIES_TO_CHECK.every(property => property in (value as HTMLElement))
  );
};

is.empty = (value: unknown): boolean => {
  return (
    (is.string(value) && value.length === 0) ||
    (is.array(value) && value.length === 0) ||
    (is.object(value) && !is.map(value) && !is.set(value) && Object.keys(value).length === 0) ||
    (is.set(value) && value.size === 0) ||
    (is.map(value) && value.size === 0)
  );
};

is.error = isObjectOfType<Error>('Error');

is.function = isOfType<Function>('function');

is.generator = (value: unknown): value is Generator => {
  return (
    is.iterable(value) &&
    is.function((value as IterableIterator<unknown>).next) &&
    is.function((value as IterableIterator<unknown>).throw)
  );
};

is.generatorFunction = isObjectOfType<GeneratorFunction>('GeneratorFunction');

is.instanceOf = <T>(instance: unknown, class_: Class<T>): instance is T => {
  if (!instance || !(class_ as Class<T>)) {
    return false;
  }

  return Object.getPrototypeOf(instance) === class_.prototype;
};

is.iterable = (value: unknown): value is IterableIterator<unknown> => {
  return (
    !is.nullOrUndefined(value) && is.function((value as IterableIterator<unknown>)[Symbol.iterator])
  );
};

is.map = isObjectOfType<Map<unknown, unknown>>('Map');

is.nan = (value: unknown): boolean => {
  return Number.isNaN(value as number);
};

is.null = (value: unknown): value is null => {
  return value === null;
};

is.nullOrUndefined = (value: unknown): value is null | undefined => {
  return is.null(value) || is.undefined(value);
};

is.number = (value: unknown): value is number => {
  return isOfType<number>('number')(value) && !is.nan(value);
};

is.numericString = (value: unknown): value is string => {
  return is.string(value) && (value as string).length > 0 && !Number.isNaN(Number(value));
};

is.object = (value: unknown): value is object => {
  return !is.nullOrUndefined(value) && (is.function(value) || typeof value === 'object');
};

is.oneOf = (target: unknown[], value: any): boolean => {
  if (!is.array(target)) {
    return false;
  }

  // eslint-disable-next-line unicorn/prefer-includes
  return target.indexOf(value) > -1;
};

is.plainFunction = isObjectOfType<Function>('Function');

is.plainObject = (value: unknown): value is PlainObject => {
  if (getObjectType(value) !== 'Object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === null || prototype === Object.getPrototypeOf({});
};

is.primitive = (value: unknown): value is Primitive =>
  is.null(value) || isPrimitiveType(typeof value);

is.promise = isObjectOfType<Promise<unknown>>('Promise');

is.propertyOf = (
  target: PlainObject,
  key: string,
  predicate?: (v: unknown) => boolean,
): boolean => {
  if (!is.object(target) || !key) {
    return false;
  }

  const value = target[key];

  if (is.function(predicate)) {
    return predicate(value);
  }

  return is.defined(value);
};

is.regexp = isObjectOfType<RegExp>('RegExp');

is.set = isObjectOfType<Set<PlainObject>>('Set');

is.string = isOfType<string>('string');

is.symbol = isOfType<symbol>('symbol');

is.undefined = isOfType<undefined>('undefined');

is.weakMap = isObjectOfType<WeakMap<PlainObject, unknown>>('WeakMap');

is.weakSet = isObjectOfType<WeakSet<PlainObject>>('WeakSet');

export default is;
