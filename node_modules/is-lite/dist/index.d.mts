import { T as TypeName, C as Class, P as PlainObject, a as Primitive } from './types-ANR2ETqw.mjs';

declare function is(value: unknown): TypeName;
declare namespace is {
    export var array: (arg: any) => arg is any[];
    export var arrayOf: (target: unknown[], predicate: (v: unknown) => boolean) => boolean;
    export var asyncGeneratorFunction: (value: unknown) => value is (...arguments_: any[]) => Promise<unknown>;
    export var asyncFunction: (value: unknown) => value is Function;
    export var bigint: (value: unknown) => value is bigint;
    export var boolean: (value: unknown) => value is boolean;
    export var date: (value: unknown) => value is Date;
    export var defined: (value: unknown) => boolean;
    export var domElement: (value: unknown) => value is HTMLElement;
    export var empty: (value: unknown) => boolean;
    export var error: (value: unknown) => value is Error;
    var _a: (value: unknown) => value is Function;
    export var generator: (value: unknown) => value is Generator<unknown, any, unknown>;
    export var generatorFunction: (value: unknown) => value is GeneratorFunction;
    export var instanceOf: <T>(instance: unknown, class_: Class<T>) => instance is T;
    export var iterable: (value: unknown) => value is IterableIterator<unknown>;
    export var map: (value: unknown) => value is Map<unknown, unknown>;
    export var nan: (value: unknown) => boolean;
    var _b: (value: unknown) => value is null;
    export var nullOrUndefined: (value: unknown) => value is null | undefined;
    export var number: (value: unknown) => value is number;
    export var numericString: (value: unknown) => value is string;
    export var object: (value: unknown) => value is object;
    export var oneOf: (target: unknown[], value: any) => boolean;
    export var plainFunction: (value: unknown) => value is Function;
    export var plainObject: (value: unknown) => value is PlainObject;
    export var primitive: (value: unknown) => value is Primitive;
    export var promise: (value: unknown) => value is Promise<unknown>;
    export var propertyOf: (target: PlainObject, key: string, predicate?: ((v: unknown) => boolean) | undefined) => boolean;
    export var regexp: (value: unknown) => value is RegExp;
    export var set: (value: unknown) => value is Set<PlainObject>;
    export var string: (value: unknown) => value is string;
    export var symbol: (value: unknown) => value is symbol;
    export var undefined: (value: unknown) => value is undefined;
    export var weakMap: (value: unknown) => value is WeakMap<PlainObject, unknown>;
    export var weakSet: (value: unknown) => value is WeakSet<PlainObject>;
    export { _a as function, _b as null };
}

export { is as default };
