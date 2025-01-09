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
export {
  src_default as default
};
//# sourceMappingURL=index.mjs.map