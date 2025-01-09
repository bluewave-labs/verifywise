// eslint-disable-next-line @typescript-eslint/ban-types
function isOfType(type) {
    return function (value) { return typeof value === type; };
}
// eslint-disable-next-line @typescript-eslint/ban-types
export var isFunction = isOfType('function');
export var isNull = function (value) {
    return value === null;
};
export var isRegex = function (value) {
    return Object.prototype.toString.call(value).slice(8, -1) === 'RegExp';
};
export var isObject = function (value) {
    return !isUndefined(value) && !isNull(value) && (isFunction(value) || typeof value === 'object');
};
export var isUndefined = isOfType('undefined');
//# sourceMappingURL=helpers.js.map