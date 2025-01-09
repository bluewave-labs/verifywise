import { AnyObject, Primitive } from './types';

/**
 * Checks if the value is of a specified type.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function isOfType<T extends Primitive | Function>(type: string) {
  // eslint-disable-next-line valid-typeof
  return (value: unknown): value is T => typeof value === type;
}

/**
 * Checks if the value is a JavaScript function.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const isFunction = isOfType<Function>('function');

/**
 * Check if the value is null.
 */
export const isNull = (value: unknown): value is null => {
  return value === null;
};

/**
 * Checks if the input is a regular expression.
 */
export const isRegex = (value: unknown): value is RegExp => {
  return Object.prototype.toString.call(value).slice(8, -1) === 'RegExp';
};

/**
 * Checks if the value is an object.
 */
export const isObject = (value: unknown): value is AnyObject => {
  return !isUndefined(value) && !isNull(value) && (isFunction(value) || typeof value === 'object');
};

/**
 * Checks if the value is undefined.
 */
export const isUndefined = isOfType<undefined>('undefined');
