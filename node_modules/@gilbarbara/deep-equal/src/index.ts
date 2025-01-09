import { isObject, isRegex } from './helpers';

/**
 * Check if arrays are equal.
 */
function equalArray(left: unknown[], right: unknown[]) {
  const { length } = left;

  if (length !== right.length) {
    return false;
  }

  for (let index = length; index-- !== 0; ) {
    if (!equal(left[index], right[index])) {
      return false;
    }
  }

  return true;
}

/**
 * Check if array buffers are equal.
 */
function equalArrayBuffer(left: ArrayBufferView, right: ArrayBufferView) {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  const view1 = new DataView(left.buffer);
  const view2 = new DataView(right.buffer);

  let index = left.byteLength;

  while (index--) {
    if (view1.getUint8(index) !== view2.getUint8(index)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if maps are equal.
 */
function equalMap(left: Map<unknown, unknown>, right: Map<unknown, unknown>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const index of left.entries()) {
    if (!right.has(index[0])) {
      return false;
    }
  }

  for (const index of left.entries()) {
    if (!equal(index[1], right.get(index[0]))) {
      return false;
    }
  }

  return true;
}

/**
 * Check if sets are equal.
 */
function equalSet(left: Set<unknown>, right: Set<unknown>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const index of left.entries()) {
    if (!right.has(index[0])) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if two values are equal.
 */
export default function equal(left: unknown, right: unknown) {
  if (left === right) {
    return true;
  }

  if (left && isObject(left) && right && isObject(right)) {
    if (left.constructor !== right.constructor) {
      return false;
    }

    if (Array.isArray(left) && Array.isArray(right)) {
      return equalArray(left, right);
    }

    if (left instanceof Map && right instanceof Map) {
      return equalMap(left, right);
    }

    if (left instanceof Set && right instanceof Set) {
      return equalSet(left, right);
    }

    if (ArrayBuffer.isView(left) && ArrayBuffer.isView(right)) {
      return equalArrayBuffer(left, right);
    }

    if (isRegex(left) && isRegex(right)) {
      return left.source === right.source && left.flags === right.flags;
    }

    if (left.valueOf !== Object.prototype.valueOf) {
      return left.valueOf() === right.valueOf();
    }

    if (left.toString !== Object.prototype.toString) {
      return left.toString() === right.toString();
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    for (let index = leftKeys.length; index-- !== 0; ) {
      if (!Object.prototype.hasOwnProperty.call(right, leftKeys[index])) {
        return false;
      }
    }

    for (let index = leftKeys.length; index-- !== 0; ) {
      const key = leftKeys[index];

      if (key === '_owner' && left.$$typeof) {
        // React-specific: avoid traversing React elements' _owner.
        //  _owner contains circular references
        // and is not needed when comparing the actual elements (and not their owners)
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!equal(left[key], right[key])) {
        return false;
      }
    }

    return true;
  }

  if (Number.isNaN(left) && Number.isNaN(right)) {
    return true;
  }

  return left === right;
}
