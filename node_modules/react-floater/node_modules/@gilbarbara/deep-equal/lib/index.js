"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
function equalArray(left, right) {
    var length = left.length;
    if (length !== right.length) {
        return false;
    }
    for (var index = length; index-- !== 0;) {
        if (!equal(left[index], right[index])) {
            return false;
        }
    }
    return true;
}
function equalArrayBuffer(left, right) {
    if (left.byteLength !== right.byteLength) {
        return false;
    }
    var view1 = new DataView(left.buffer);
    var view2 = new DataView(right.buffer);
    var index = left.byteLength;
    while (index--) {
        if (view1.getUint8(index) !== view2.getUint8(index)) {
            return false;
        }
    }
    return true;
}
function equalMap(left, right) {
    var e_1, _a, e_2, _b;
    if (left.size !== right.size) {
        return false;
    }
    try {
        for (var _c = __values(left.entries()), _d = _c.next(); !_d.done; _d = _c.next()) {
            var index = _d.value;
            if (!right.has(index[0])) {
                return false;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_1) throw e_1.error; }
    }
    try {
        for (var _e = __values(left.entries()), _f = _e.next(); !_f.done; _f = _e.next()) {
            var index = _f.value;
            if (!equal(index[1], right.get(index[0]))) {
                return false;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return true;
}
function equalSet(left, right) {
    var e_3, _a;
    if (left.size !== right.size) {
        return false;
    }
    try {
        for (var _b = __values(left.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var index = _c.value;
            if (!right.has(index[0])) {
                return false;
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return true;
}
function equal(left, right) {
    if (left === right) {
        return true;
    }
    if (left && (0, helpers_1.isObject)(left) && right && (0, helpers_1.isObject)(right)) {
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
        if ((0, helpers_1.isRegex)(left) && (0, helpers_1.isRegex)(right)) {
            return left.source === right.source && left.flags === right.flags;
        }
        if (left.valueOf !== Object.prototype.valueOf) {
            return left.valueOf() === right.valueOf();
        }
        if (left.toString !== Object.prototype.toString) {
            return left.toString() === right.toString();
        }
        var leftKeys = Object.keys(left);
        var rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length) {
            return false;
        }
        for (var index = leftKeys.length; index-- !== 0;) {
            if (!Object.prototype.hasOwnProperty.call(right, leftKeys[index])) {
                return false;
            }
        }
        for (var index = leftKeys.length; index-- !== 0;) {
            var key = leftKeys[index];
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
exports.default = equal;
//# sourceMappingURL=index.js.map