// src/index.ts
import equal2 from "@gilbarbara/deep-equal";
import is2 from "is-lite";

// src/helpers.ts
import equal from "@gilbarbara/deep-equal";
import is from "is-lite";
function canHaveLength(...arguments_) {
  return arguments_.every((d) => is.string(d) || is.array(d) || is.plainObject(d));
}
function checkEquality(left, right, value) {
  if (!isSameType(left, right)) {
    return false;
  }
  if ([left, right].every(is.array)) {
    return !left.some(hasValue(value)) && right.some(hasValue(value));
  }
  if ([left, right].every(is.plainObject)) {
    return !Object.entries(left).some(hasEntry(value)) && Object.entries(right).some(hasEntry(value));
  }
  return right === value;
}
function compareNumbers(previousData, data, options) {
  const { actual, key, previous, type } = options;
  const left = nested(previousData, key);
  const right = nested(data, key);
  let changed = [left, right].every(is.number) && (type === "increased" ? left < right : left > right);
  if (!is.undefined(actual)) {
    changed = changed && right === actual;
  }
  if (!is.undefined(previous)) {
    changed = changed && left === previous;
  }
  return changed;
}
function compareValues(previousData, data, options) {
  const { key, type, value } = options;
  const left = nested(previousData, key);
  const right = nested(data, key);
  const primary = type === "added" ? left : right;
  const secondary = type === "added" ? right : left;
  if (!is.nullOrUndefined(value)) {
    if (is.defined(primary)) {
      if (is.array(primary) || is.plainObject(primary)) {
        return checkEquality(primary, secondary, value);
      }
    } else {
      return equal(secondary, value);
    }
    return false;
  }
  if ([left, right].every(is.array)) {
    return !secondary.every(isEqualPredicate(primary));
  }
  if ([left, right].every(is.plainObject)) {
    return hasExtraKeys(Object.keys(primary), Object.keys(secondary));
  }
  return ![left, right].every((d) => is.primitive(d) && is.defined(d)) && (type === "added" ? !is.defined(left) && is.defined(right) : is.defined(left) && !is.defined(right));
}
function getIterables(previousData, data, { key } = {}) {
  let left = nested(previousData, key);
  let right = nested(data, key);
  if (!isSameType(left, right)) {
    throw new TypeError("Inputs have different types");
  }
  if (!canHaveLength(left, right)) {
    throw new TypeError("Inputs don't have length");
  }
  if ([left, right].every(is.plainObject)) {
    left = Object.keys(left);
    right = Object.keys(right);
  }
  return [left, right];
}
function hasEntry(input) {
  return ([key, value]) => {
    if (is.array(input)) {
      return equal(input, value) || input.some((d) => equal(d, value) || is.array(value) && isEqualPredicate(value)(d));
    }
    if (is.plainObject(input) && input[key]) {
      return !!input[key] && equal(input[key], value);
    }
    return equal(input, value);
  };
}
function hasExtraKeys(left, right) {
  return right.some((d) => !left.includes(d));
}
function hasValue(input) {
  return (value) => {
    if (is.array(input)) {
      return input.some((d) => equal(d, value) || is.array(value) && isEqualPredicate(value)(d));
    }
    return equal(input, value);
  };
}
function includesOrEqualsTo(previousValue, value) {
  return is.array(previousValue) ? previousValue.some((d) => equal(d, value)) : equal(previousValue, value);
}
function isEqualPredicate(data) {
  return (value) => data.some((d) => equal(d, value));
}
function isSameType(...arguments_) {
  return arguments_.every(is.array) || arguments_.every(is.number) || arguments_.every(is.plainObject) || arguments_.every(is.string);
}
function nested(data, property) {
  if (is.plainObject(data) || is.array(data)) {
    if (is.string(property)) {
      const props = property.split(".");
      return props.reduce((acc, d) => acc && acc[d], data);
    }
    if (is.number(property)) {
      return data[property];
    }
    return data;
  }
  return data;
}

// src/index.ts
function treeChanges(previousData, data) {
  if ([previousData, data].some(is2.nullOrUndefined)) {
    throw new Error("Missing required parameters");
  }
  if (![previousData, data].every((d) => is2.plainObject(d) || is2.array(d))) {
    throw new Error("Expected plain objects or array");
  }
  const added = (key, value) => {
    try {
      return compareValues(previousData, data, { key, type: "added", value });
    } catch {
      return false;
    }
  };
  const changed = (key, actual, previous) => {
    try {
      const left = nested(previousData, key);
      const right = nested(data, key);
      const hasActual = is2.defined(actual);
      const hasPrevious = is2.defined(previous);
      if (hasActual || hasPrevious) {
        const leftComparator = hasPrevious ? includesOrEqualsTo(previous, left) : !includesOrEqualsTo(actual, left);
        const rightComparator = includesOrEqualsTo(actual, right);
        return leftComparator && rightComparator;
      }
      if ([left, right].every(is2.array) || [left, right].every(is2.plainObject)) {
        return !equal2(left, right);
      }
      return left !== right;
    } catch {
      return false;
    }
  };
  const changedFrom = (key, previous, actual) => {
    if (!is2.defined(key)) {
      return false;
    }
    try {
      const left = nested(previousData, key);
      const right = nested(data, key);
      const hasActual = is2.defined(actual);
      return includesOrEqualsTo(previous, left) && (hasActual ? includesOrEqualsTo(actual, right) : !hasActual);
    } catch {
      return false;
    }
  };
  const decreased = (key, actual, previous) => {
    if (!is2.defined(key)) {
      return false;
    }
    try {
      return compareNumbers(previousData, data, { key, actual, previous, type: "decreased" });
    } catch {
      return false;
    }
  };
  const emptied = (key) => {
    try {
      const [left, right] = getIterables(previousData, data, { key });
      return !!left.length && !right.length;
    } catch {
      return false;
    }
  };
  const filled = (key) => {
    try {
      const [left, right] = getIterables(previousData, data, { key });
      return !left.length && !!right.length;
    } catch {
      return false;
    }
  };
  const increased = (key, actual, previous) => {
    if (!is2.defined(key)) {
      return false;
    }
    try {
      return compareNumbers(previousData, data, { key, actual, previous, type: "increased" });
    } catch {
      return false;
    }
  };
  const removed = (key, value) => {
    try {
      return compareValues(previousData, data, { key, type: "removed", value });
    } catch {
      return false;
    }
  };
  return { added, changed, changedFrom, decreased, emptied, filled, increased, removed };
}
export {
  treeChanges as default
};
//# sourceMappingURL=index.mjs.map