# tolmach

  [![NPM Version][npm-image]][npm-url]
  [![NPM Downloads][downloads-image]][downloads-url]
  [![Build Status][travis-image]][travis-url]

  It renders an image from a code snippet. It based on [node-canvas](https://github.com/Automattic/node-canvas) module.

## Installation

    $ npm install code2image

## Example

```js
var code2image = require('code2image');
var styles = {};

code2image.render("var hello = 'hello';\nvar world = 'world';\nconsole.log(hello + ' ' + world);", 'test.png', styles, function(){
    console.log('ok!');
});

```

Result:

![alt tag](https://raw.github.com/kreshikhin/code2image/master/test/example/test.png)

## Supported languages

https://github.com/kreshikhin/tolmach/blob/master/README.md#supported-languages

## License

  [MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/code2image.svg
[npm-url]: https://npmjs.org/package/code2image
[downloads-image]: https://img.shields.io/npm/dm/code2image.svg
[downloads-url]: https://npmjs.org/package/code2image
[travis-image]: https://img.shields.io/travis/kreshikhin/code2image/master.svg
[travis-url]: https://travis-ci.org/kreshikhin/code2image
