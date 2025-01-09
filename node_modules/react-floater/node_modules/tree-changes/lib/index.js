"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
var deep_equal_1 = require("@gilbarbara/deep-equal");
var is_lite_1 = require("is-lite");
var helpers_1 = require("./helpers");
function treeChanges(previousData, data) {
    if ([previousData, data].some(is_lite_1.default.nullOrUndefined)) {
        throw new Error('Missing required parameters');
    }
    if (![previousData, data].every(function (d) { return is_lite_1.default.plainObject(d) || is_lite_1.default.array(d); })) {
        throw new Error('Expected plain objects or array');
    }
    var added = function (key, value) {
        try {
            return (0, helpers_1.compareValues)(previousData, data, { key: key, type: 'added', value: value });
        }
        catch (_a) {
            /* istanbul ignore next */
            return false;
        }
    };
    var changed = function (key, actual, previous) {
        try {
            var left = (0, helpers_1.nested)(previousData, key);
            var right = (0, helpers_1.nested)(data, key);
            var hasActual = is_lite_1.default.defined(actual);
            var hasPrevious = is_lite_1.default.defined(previous);
            if (hasActual || hasPrevious) {
                var leftComparator = hasPrevious
                    ? (0, helpers_1.includesOrEqualsTo)(previous, left)
                    : !(0, helpers_1.includesOrEqualsTo)(actual, left);
                var rightComparator = (0, helpers_1.includesOrEqualsTo)(actual, right);
                return leftComparator && rightComparator;
            }
            if ([left, right].every(is_lite_1.default.array) || [left, right].every(is_lite_1.default.plainObject)) {
                return !(0, deep_equal_1.default)(left, right);
            }
            return left !== right;
        }
        catch (_a) {
            /* istanbul ignore next */
            return false;
        }
    };
    var changedFrom = function (key, previous, actual) {
        if (!is_lite_1.default.defined(key)) {
            return false;
        }
        try {
            var left = (0, helpers_1.nested)(previousData, key);
            var right = (0, helpers_1.nested)(data, key);
            var hasActual = is_lite_1.default.defined(actual);
            return ((0, helpers_1.includesOrEqualsTo)(previous, left) &&
                (hasActual ? (0, helpers_1.includesOrEqualsTo)(actual, right) : !hasActual));
        }
        catch (_a) {
            /* istanbul ignore next */
            return false;
        }
    };
    /**
     * @deprecated
     * Use "changed" instead
     */
    var changedTo = function (key, actual) {
        if (!is_lite_1.default.defined(key)) {
            return false;
        }
        /* istanbul ignore next */
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn('`changedTo` is deprecated! Replace it with `change`');
        }
        return changed(key, actual);
    };
    var decreased = function (key, actual, previous) {
        if (!is_lite_1.default.defined(key)) {
            return false;
        }
        try {
            return (0, helpers_1.compareNumbers)(previousData, data, { key: key, actual: actual, previous: previous, type: 'decreased' });
        }
        catch (_a) {
            /* istanbul ignore next */
            return false;
        }
    };
    var emptied = function (key) {
        try {
            var _a = (0, helpers_1.getIterables)(previousData, data, { key: key }), left = _a[0], right = _a[1];
            return !!left.length && !right.length;
        }
        catch (_b) {
            /* istanbul ignore next */
            return false;
        }
    };
    var filled = function (key) {
        try {
            var _a = (0, helpers_1.getIterables)(previousData, data, { key: key }), left = _a[0], right = _a[1];
            return !left.length && !!right.length;
        }
        catch (_b) {
            /* istanbul ignore next */
            return false;
        }
    };
    var increased = function (key, actual, previous) {
        if (!is_lite_1.default.defined(key)) {
            return false;
        }
        try {
            return (0, helpers_1.compareNumbers)(previousData, data, { key: key, actual: actual, previous: previous, type: 'increased' });
        }
        catch (_a) {
            /* istanbul ignore next */
            return false;
        }
    };
    var removed = function (key, value) {
        try {
            return (0, helpers_1.compareValues)(previousData, data, { key: key, type: 'removed', value: value });
        }
        catch (_a) {
            /* istanbul ignore next */
            return false;
        }
    };
    return { added: added, changed: changed, changedFrom: changedFrom, changedTo: changedTo, decreased: decreased, emptied: emptied, filled: filled, increased: increased, removed: removed };
}
exports.default = treeChanges;
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map