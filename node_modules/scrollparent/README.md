# scrollparent

[![NPM version][npm-image]][npm-url]
[![Size][size-image]][size-url]
[![Download count][downloads-image]][downloads-url]
![Build status][build-image]

A function to get the scrolling parent of a html element.

## Install

```bash
npm install scrollparent --save
```

## Example

```js
var Scrollparent = require("scrollparent");

Scrollparent(document.getElementById("content")) // HTMLHtmlElement or HTMLBodyElement as appropriate
```

```js
var Scrollparent = require("scrollparent");

Scrollparent(document.getElementById("inside-a-scrolling-div")) // HTMLDivElement
```

## Note about the root scrolling element

Internally, the root scrolling element is determined in this library
as the result of

```js
document.scrollingElement || document.documentElement;
```

This should give a usable result in most browsers today
but if you want to ensure full support
you should use a `document.scrollingElement` polyfill such as
[this one](https://github.com/mathiasbynens/document.scrollingElement).

## Contributors

<a href="https://github.com/olahol/scrollparent.js/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=olahol/scrollparent.js" />
</a>

## License

MIT

[build-image]: https://github.com/olahol/scrollparent.js/actions/workflows/playwright.yml/badge.svg
[npm-image]: https://img.shields.io/npm/v/scrollparent.svg
[npm-url]: https://npmjs.org/package/scrollparent
[downloads-image]: http://img.shields.io/npm/dm/scrollparent.svg
[downloads-url]: https://npmjs.org/package/scrollparent
[size-image]: https://img.badgesize.io/olahol/scrollparent.js/master/scrollparent.js.svg
[size-url]: https://github.com/olahol/scrollparent.js/blob/master/scrollparent.js
