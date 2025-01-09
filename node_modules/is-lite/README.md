# is-lite

[![NPM version](https://badge.fury.io/js/is-lite.svg)](https://www.npmjs.com/package/is-lite) [![CI](https://github.com/gilbarbara/is-lite/actions/workflows/main.yml/badge.svg)](https://github.com/gilbarbara/is-lite/actions/workflows/main.yml) [![is-lite](https://badgen.net/bundlephobia/minzip/is-lite?label=size)](https://bundlephobia.com/result?p=is-lite) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara_is-lite&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=gilbarbara_is-lite) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara_is-lite&metric=coverage)](https://sonarcloud.io/summary/new_code?id=gilbarbara_is-lite)

> Lightweight type check tool.

Typescript ready with [type guards](http://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types) to infer the correct type inside conditionals.

## Setup

```bash
npm install is-lite
```

## Usage

```ts
import is from 'is-lite';

is('value'); // string
is.string('value'); // true
```

You can also import any checker individually since 1.0

```ts
import { isString } from 'is-lite/exports';

isString('value'); // true
```

## API

**is(value)**  
Returns the type of the `value`.

Primitives are lowercase: `bigint`, `boolean`, `null`, `number`, `string`, `symbol`, `undefined`.
The rest are camelcase: `Array`, `Function`, `GeneratorFunction`, `Object`, ...

**is.array(value)**

**is.arrayOf(target: any[], predicate: (value: unknown) => boolean)**  
Check if all items in an array are of the same type.

```ts
is.arrayOf(['a', 'b'], is.string); // true
is.arrayOf([123, 456], is.nnumber); // true

is.arrayOf(['a', 1], is.string); // false
```

**is.asyncFunction(value)**  
Check if the `value` is an `async` function that can be called with `await`.

```ts
is.asyncFunction(async () => {}); // true
is.asyncFunction(() => {}); // false
```

**is.asyncGeneratorFunction(value)**

**is.bigint(value)**

**is.boolean(value)**

**is.date(value)**

**is.defined(value)**  
Check if the `value` is anything but `undefined`.

**is.domElement(value)**  
Check if the `value` is a DOM Element.

**is.empty(value)**  
Returns `true` if:

- the value is a `string`, and the `length` is 0
- the value is an `Object` and `Object.keys(value).length` is 0
- the value is an `Array`, and the `length` is 0
- the value is a `Map`, and the `size` is 0
- the value is a `Set`, and the `size` is 0

**is.error(value)**

**is.function(value)**

**is.generator(value)**  
Check for an object that has its own .next() and .throw() methods and has a function definition for `Symbol.iterator`

**is.generatorFunction(value)**

**is.instanceOf(value, class)**  
Check if the `value` is a direct instance of the `class`.

```ts
class APIError extends Error {}

const error = new APIError('Fail');

is.instanceOf(error, APIError); // true
is.instanceOf(error, Error); // false
```

**is.iterable(value)**

**is.map(value)**

**is.nan(value)**

**is.null(value)**

**is.nullOrUndefined(value)**

**is.number(value)**  
Note: `is.number(NaN)` returns `false`

**is.numericString(value)**  
Check for a string that represents a number.

```ts
is.numericString('42'); // true
is.numericString('-5'); // true
is.numericString('Inifinity'); // true
is.numericString('NaN'); // true
```

**is.plainFunction(value)**  
Check if the `value` is a function (it doesn't include async and generator functions)

**is.primitive(value)**

**is.object(value)**  
Remember that functions and arrays are objects too.

**is.oneOf(target: any[], value: any)**  
Check if the `value` exists in the `target`

```ts
const colors = ['red', 'green', 'blue'];

is.oneOf(colors, 'green'); // true
is.oneOf(colors, 'brown'); // false
```

**is.plainObject(value)**  
Check if the object is created by either `{}`, `new Object()` or `Object.create(null)`.

**is.promise(value)**

**is.propertyOf(target: object, key: string, predicate?: (value: unknown) => boolean)**  
Check if the `key` exists in the `target`. If you pass a `predicate` function, it will check the value's type.

```ts
const map = { items: [1], isLogged: false, retries: 0 };

is.propertyOf(map, 'retries'); // true
is.propertyOf(map, 'auth'); // false

is.propertyOf(map, 'retries', is.number); // true
is.propertyOf(map, 'items', is.array); // true
is.propertyOf(map, 'isLogged', is.string); // false
```

**is.regexp(value)**

**is.set(value)**

**is.string(value)**

**is.symbol(value)**

**is.undefined(value)**

**is.weakMap(value)**

**is.weakSet(value)**

## Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/gilbarbara/is-lite/issues).

## Show your support

Give a ⭐️ if this project helped you!

## License

Copyright © 2019 [Gil Barbara <gilbarbara@gmail.com>](https://github.com/gilbarbara).  
This project is [MIT](https://github.com/gilbarbara/is-lite/blob/main/LICENSE) licensed.

## FAQ

[@sindresorhus/is](https://github.com/sindresorhus/is) is fantastic, but I needed something even smaller (and simpler). This package covers the basics and is just 1k minified+gzipped.

If you need to support legacy browsers, the **Number.isNaN** polyfill is required.
