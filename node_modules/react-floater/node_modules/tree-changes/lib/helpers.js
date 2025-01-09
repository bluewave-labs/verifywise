"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nested = exports.isSameType = exports.isEqualPredicate = exports.includesOrEqualsTo = exports.hasValue = exports.hasExtraKeys = exports.hasEntry = exports.getIterables = exports.compareValues = exports.compareNumbers = exports.checkEquality = exports.canHaveLength = void 0;
var deep_equal_1 = require("@gilbarbara/deep-equal");
var is_lite_1 = require("is-lite");
function canHaveLength() {
    var arguments_ = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        arguments_[_i] = arguments[_i];
    }
    return arguments_.every(function (d) { return is_lite_1.default.string(d) || is_lite_1.default.array(d) || is_lite_1.default.plainObject(d); });
}
exports.canHaveLength = canHaveLength;
function checkEquality(left, right, value) {
    if (!isSameType(left, right)) {
        return false;
    }
    if ([left, right].every(is_lite_1.default.array)) {
        return !left.some(hasValue(value)) && right.some(hasValue(value));
    }
    /* istanbul ignore else */
    if ([left, right].every(is_lite_1.default.plainObject)) {
        return (!Object.entries(left).some(hasEntry(value)) && Object.entries(right).some(hasEntry(value)));
    }
    return right === value;
}
exports.checkEquality = checkEquality;
function compareNumbers(previousData, data, options) {
    var actual = options.actual, key = options.key, previous = options.previous, type = options.type;
    var left = nested(previousData, key);
    var right = nested(data, key);
    var changed = [left, right].every(is_lite_1.default.number) && (type === 'increased' ? left < right : left > right);
    if (!is_lite_1.default.undefined(actual)) {
        changed = changed && right === actual;
    }
    if (!is_lite_1.default.undefined(previous)) {
        changed = changed && left === previous;
    }
    return changed;
}
exports.compareNumbers = compareNumbers;
function compareValues(previousData, data, options) {
    var key = options.key, type = options.type, value = options.value;
    var left = nested(previousData, key);
    var right = nested(data, key);
    var primary = type === 'added' ? left : right;
    var secondary = type === 'added' ? right : left;
    // console.log({ primary, secondary });
    if (!is_lite_1.default.nullOrUndefined(value)) {
        if (is_lite_1.default.defined(primary)) {
            // check if nested data matches
            if (is_lite_1.default.array(primary) || is_lite_1.default.plainObject(primary)) {
                return checkEquality(primary, secondary, value);
            }
        }
        else {
            return (0, deep_equal_1.default)(secondary, value);
        }
        return false;
    }
    if ([left, right].every(is_lite_1.default.array)) {
        return !secondary.every(isEqualPredicate(primary));
    }
    if ([left, right].every(is_lite_1.default.plainObject)) {
        return hasExtraKeys(Object.keys(primary), Object.keys(secondary));
    }
    return (![left, right].every(function (d) { return is_lite_1.default.primitive(d) && is_lite_1.default.defined(d); }) &&
        (type === 'added'
            ? !is_lite_1.default.defined(left) && is_lite_1.default.defined(right)
            : is_lite_1.default.defined(left) && !is_lite_1.default.defined(right)));
}
exports.compareValues = compareValues;
function getIterables(previousData, data, _a) {
    var _b = _a === void 0 ? {} : _a, key = _b.key;
    var left = nested(previousData, key);
    var right = nested(data, key);
    if (!isSameType(left, right)) {
        throw new TypeError('Inputs have different types');
    }
    if (!canHaveLength(left, right)) {
        throw new TypeError("Inputs don't have length");
    }
    if ([left, right].every(is_lite_1.default.plainObject)) {
        left = Object.keys(left);
        right = Object.keys(right);
    }
    return [left, right];
}
exports.getIterables = getIterables;
function hasEntry(input) {
    return function (_a) {
        var key = _a[0], value = _a[1];
        if (is_lite_1.default.array(input)) {
            return ((0, deep_equal_1.default)(input, value) ||
                input.some(function (d) { return (0, deep_equal_1.default)(d, value) || (is_lite_1.default.array(value) && isEqualPredicate(value)(d)); }));
        }
        /* istanbul ignore else */
        if (is_lite_1.default.plainObject(input) && input[key]) {
            return !!input[key] && (0, deep_equal_1.default)(input[key], value);
        }
        return (0, deep_equal_1.default)(input, value);
    };
}
exports.hasEntry = hasEntry;
function hasExtraKeys(left, right) {
    return right.some(function (d) { return !left.includes(d); });
}
exports.hasExtraKeys = hasExtraKeys;
function hasValue(input) {
    return function (value) {
        if (is_lite_1.default.array(input)) {
            return input.some(function (d) { return (0, deep_equal_1.default)(d, value) || (is_lite_1.default.array(value) && isEqualPredicate(value)(d)); });
        }
        return (0, deep_equal_1.default)(input, value);
    };
}
exports.hasValue = hasValue;
function includesOrEqualsTo(previousValue, value) {
    return is_lite_1.default.array(previousValue)
        ? previousValue.some(function (d) { return (0, deep_equal_1.default)(d, value); })
        : (0, deep_equal_1.default)(previousValue, value);
}
exports.includesOrEqualsTo = includesOrEqualsTo;
function isEqualPredicate(data) {
    return function (value) { return data.some(function (d) { return (0, deep_equal_1.default)(d, value); }); };
}
exports.isEqualPredicate = isEqualPredicate;
function isSameType() {
    var arguments_ = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        arguments_[_i] = arguments[_i];
    }
    return (arguments_.every(is_lite_1.default.array) ||
        arguments_.every(is_lite_1.default.number) ||
        arguments_.every(is_lite_1.default.plainObject) ||
        arguments_.every(is_lite_1.default.string));
}
exports.isSameType = isSameType;
function nested(data, property) {
    /* istanbul ignore else */
    if (is_lite_1.default.plainObject(data) || is_lite_1.default.array(data)) {
        /* istanbul ignore else */
        if (is_lite_1.default.string(property)) {
            var props = property.split('.');
            return props.reduce(function (acc, d) { return acc && acc[d]; }, data);
        }
        /* istanbul ignore else */
        if (is_lite_1.default.number(property)) {
            return data[property];
        }
        return data;
    }
    return data;
}
exports.nested = nested;
//# sourceMappingURL=helpers.js.map