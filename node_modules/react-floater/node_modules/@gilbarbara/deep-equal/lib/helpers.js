"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUndefined = exports.isObject = exports.isRegex = exports.isNull = exports.isFunction = void 0;
// eslint-disable-next-line @typescript-eslint/ban-types
function isOfType(type) {
    return function (value) { return typeof value === type; };
}
// eslint-disable-next-line @typescript-eslint/ban-types
exports.isFunction = isOfType('function');
var isNull = function (value) {
    return value === null;
};
exports.isNull = isNull;
var isRegex = function (value) {
    return Object.prototype.toString.call(value).slice(8, -1) === 'RegExp';
};
exports.isRegex = isRegex;
var isObject = function (value) {
    return !(0, exports.isUndefined)(value) && !(0, exports.isNull)(value) && ((0, exports.isFunction)(value) || typeof value === 'object');
};
exports.isObject = isObject;
exports.isUndefined = isOfType('undefined');
//# sourceMappingURL=helpers.js.map