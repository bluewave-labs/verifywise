import { AnyObject, Primitive } from './types';

// eslint-disable-next-line @typescript-eslint/ban-types
function isOfType<T extends Primitive | Function>(type: string) {
  return (value: unknown): value is T => typeof value === type;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const isFunction = isOfType<Function>('function');

export const isNull = (value: unknown): value is null => {
  return value === null;
};

export const isRegex = (value: unknown): value is RegExp => {
  return Object.prototype.toString.call(value).slice(8, -1) === 'RegExp';
};

export const isObject = (value: unknown): value is AnyObject => {
  return !isUndefined(value) && !isNull(value) && (isFunction(value) || typeof value === 'object');
};

export const isUndefined = isOfType<undefined>('undefined');
