"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/exports.ts
var exports_exports = {};
__export(exports_exports, {
  isArray: () => isArray,
  isArrayOf: () => isArrayOf,
  isAsyncFunction: () => isAsyncFunction,
  isAsyncGeneratorFunction: () => isAsyncGeneratorFunction,
  isBigInt: () => isBigInt,
  isBoolean: () => isBoolean,
  isDate: () => isDate,
  isDefined: () => isDefined,
  isDomElement: () => isDomElement,
  isEmpty: () => isEmpty,
  isError: () => isError,
  isFunction: () => isFunction,
  isGenerator: () => isGenerator,
  isGeneratorFunction: () => isGeneratorFunction,
  isInstanceOf: () => isInstanceOf,
  isIterable: () => isIterable,
  isMap: () => isMap,
  isNan: () => isNan,
  isNull: () => isNull,
  isNullOrUndefined: () => isNullOrUndefined,
  isNumber: () => isNumber,
  isNumericString: () => isNumericString,
  isObject: () => isObject,
  isOneOf: () => isOneOf,
  isPlainFunction: () => isPlainFunction,
  isPlainObject: () => isPlainObject,
  isPrimitive: () => isPrimitive,
  isPromise: () => isPromise,
  isPropertyOf: () => isPropertyOf,
  isRegexp: () => isRegexp,
  isSet: () => isSet,
  isString: () => isString,
  isSymbol: () => isSymbol,
  isUndefined: () => isUndefined,
  isWeakMap: () => isWeakMap,
  isWeakSet: () => isWeakSet
});
module.exports = __toCommonJS(exports_exports);

// src/helpers.ts
var objectTypes = [
  "Array",
  "ArrayBuffer",
  "AsyncFunction",
  "AsyncGenerator",
  "AsyncGeneratorFunction",
  "Date",
  "Error",
  "Function",
  "Generator",
  "GeneratorFunction",
  "HTMLElement",
  "Map",
  "Object",
  "Promise",
  "RegExp",
  "Set",
  "WeakMap",
  "WeakSet"
];
var primitiveTypes = [
  "bigint",
  "boolean",
  "null",
  "number",
  "string",
  "symbol",
  "undefined"
];
function getObjectType(value) {
  const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);
  if (/HTML\w+Element/.test(objectTypeName)) {
    return "HTMLElement";
  }
  if (isObjectType(objectTypeName)) {
    return objectTypeName;
  }
  return void 0;
}
function isObjectOfType(type) {
  return (value) => getObjectType(value) === type;
}
function isObjectType(name) {
  return objectTypes.includes(name);
}
function isOfType(type) {
  return (value) => typeof value === type;
}
function isPrimitiveType(name) {
  return primitiveTypes.includes(name);
}

// src/index.ts
var DOM_PROPERTIES_TO_CHECK = [
  "innerHTML",
  "ownerDocument",
  "style",
  "attributes",
  "nodeValue"
];
function is(value) {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "bigint":
      return "bigint";
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
    case "symbol":
      return "symbol";
    case "undefined":
      return "undefined";
    default:
  }
  if (is.array(value)) {
    return "Array";
  }
  if (is.plainFunction(value)) {
    return "Function";
  }
  const tagType = getObjectType(value);
  if (tagType) {
    return tagType;
  }
  return "Object";
}
is.array = Array.isArray;
is.arrayOf = (target, predicate) => {
  if (!is.array(target) && !is.function(predicate)) {
    return false;
  }
  return target.every((d) => predicate(d));
};
is.asyncGeneratorFunction = (value) => getObjectType(value) === "AsyncGeneratorFunction";
is.asyncFunction = isObjectOfType("AsyncFunction");
is.bigint = isOfType("bigint");
is.boolean = (value) => {
  return value === true || value === false;
};
is.date = isObjectOfType("Date");
is.defined = (value) => !is.undefined(value);
is.domElement = (value) => {
  return is.object(value) && !is.plainObject(value) && value.nodeType === 1 && is.string(value.nodeName) && DOM_PROPERTIES_TO_CHECK.every((property) => property in value);
};
is.empty = (value) => {
  return is.string(value) && value.length === 0 || is.array(value) && value.length === 0 || is.object(value) && !is.map(value) && !is.set(value) && Object.keys(value).length === 0 || is.set(value) && value.size === 0 || is.map(value) && value.size === 0;
};
is.error = isObjectOfType("Error");
is.function = isOfType("function");
is.generator = (value) => {
  return is.iterable(value) && is.function(value.next) && is.function(value.throw);
};
is.generatorFunction = isObjectOfType("GeneratorFunction");
is.instanceOf = (instance, class_) => {
  if (!instance || !class_) {
    return false;
  }
  return Object.getPrototypeOf(instance) === class_.prototype;
};
is.iterable = (value) => {
  return !is.nullOrUndefined(value) && is.function(value[Symbol.iterator]);
};
is.map = isObjectOfType("Map");
is.nan = (value) => {
  return Number.isNaN(value);
};
is.null = (value) => {
  return value === null;
};
is.nullOrUndefined = (value) => {
  return is.null(value) || is.undefined(value);
};
is.number = (value) => {
  return isOfType("number")(value) && !is.nan(value);
};
is.numericString = (value) => {
  return is.string(value) && value.length > 0 && !Number.isNaN(Number(value));
};
is.object = (value) => {
  return !is.nullOrUndefined(value) && (is.function(value) || typeof value === "object");
};
is.oneOf = (target, value) => {
  if (!is.array(target)) {
    return false;
  }
  return target.indexOf(value) > -1;
};
is.plainFunction = isObjectOfType("Function");
is.plainObject = (value) => {
  if (getObjectType(value) !== "Object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.getPrototypeOf({});
};
is.primitive = (value) => is.null(value) || isPrimitiveType(typeof value);
is.promise = isObjectOfType("Promise");
is.propertyOf = (target, key, predicate) => {
  if (!is.object(target) || !key) {
    return false;
  }
  const value = target[key];
  if (is.function(predicate)) {
    return predicate(value);
  }
  return is.defined(value);
};
is.regexp = isObjectOfType("RegExp");
is.set = isObjectOfType("Set");
is.string = isOfType("string");
is.symbol = isOfType("symbol");
is.undefined = isOfType("undefined");
is.weakMap = isObjectOfType("WeakMap");
is.weakSet = isObjectOfType("WeakSet");
var src_default = is;

// src/exports.ts
var isArray = src_default.array;
var isArrayOf = src_default.arrayOf;
var isAsyncGeneratorFunction = src_default.asyncGeneratorFunction;
var isAsyncFunction = src_default.asyncFunction;
var isBigInt = src_default.bigint;
var isBoolean = src_default.boolean;
var isDate = src_default.date;
var isDefined = src_default.defined;
var isDomElement = src_default.domElement;
var isEmpty = src_default.empty;
var isError = src_default.error;
var isFunction = src_default.function;
var isGenerator = src_default.generator;
var isGeneratorFunction = src_default.generatorFunction;
var isInstanceOf = src_default.instanceOf;
var isIterable = src_default.iterable;
var isMap = src_default.map;
var isNan = src_default.nan;
var isNull = src_default.null;
var isNullOrUndefined = src_default.nullOrUndefined;
var isNumber = src_default.number;
var isNumericString = src_default.numericString;
var isObject = src_default.object;
var isOneOf = src_default.oneOf;
var isPlainFunction = src_default.plainFunction;
var isPlainObject = src_default.plainObject;
var isPrimitive = src_default.primitive;
var isPromise = src_default.promise;
var isPropertyOf = src_default.propertyOf;
var isRegexp = src_default.regexp;
var isSet = src_default.set;
var isString = src_default.string;
var isSymbol = src_default.symbol;
var isUndefined = src_default.undefined;
var isWeakMap = src_default.weakMap;
var isWeakSet = src_default.weakSet;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isArray,
  isArrayOf,
  isAsyncFunction,
  isAsyncGeneratorFunction,
  isBigInt,
  isBoolean,
  isDate,
  isDefined,
  isDomElement,
  isEmpty,
  isError,
  isFunction,
  isGenerator,
  isGeneratorFunction,
  isInstanceOf,
  isIterable,
  isMap,
  isNan,
  isNull,
  isNullOrUndefined,
  isNumber,
  isNumericString,
  isObject,
  isOneOf,
  isPlainFunction,
  isPlainObject,
  isPrimitive,
  isPromise,
  isPropertyOf,
  isRegexp,
  isSet,
  isString,
  isSymbol,
  isUndefined,
  isWeakMap,
  isWeakSet
});
//# sourceMappingURL=exports.js.map