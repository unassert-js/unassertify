unassertify
================================

[Browserify](http://browserify.org/) transform for [unassert](https://github.com/unassert-js/unassert): Encourages [programming with assertions](https://en.wikipedia.org/wiki/Assertion_(software_development)) by providing tools to compile them away.

[![unassert][unassert-banner]][unassert-url]

[![Build Status][ci-image]][ci-url]
[![NPM version][npm-image]][npm-url]
[![Code Style][style-image]][style-url]
[![License][license-image]][license-url]


#### RELATED MODULES

- [unassert](https://github.com/unassert-js/unassert): Encourages programming with assertions by providing tools to compile them away.
- [babel-plugin-unassert](https://github.com/unassert-js/babel-plugin-unassert): Babel plugin for unassert
- [webpack-unassert-loader](https://github.com/unassert-js/webpack-unassert-loader): Webpack loader for unassert
- [gulp-unassert](https://github.com/unassert-js/gulp-unassert): Gulp plugin for unassert
- [unassert-cli](https://github.com/unassert-js/unassert-cli): CLI for unassert
- [rollup-plugin-unassert](https://github.com/unassert-js/rollup-plugin-unassert): RollupJS plugin for unassert


INSTALL
---------------------------------------

```
$ npm install --save-dev unassertify
```


HOW TO USE
---------------------------------------


### via CLI

```
$ $(npm bin)/browserify -t unassertify /path/to/src/target.js > /path/to/build/target.js
```

### via API

```javascript
const source = require('vinyl-source-stream');
const browserify = require('browserify');
const glob = require('glob'),

gulp.task('production_build', function() {
    const files = glob.sync('./src/*.js');
    const b = browserify({entries: files});
    b.transform('unassertify');
    return b.bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./dist'));
});
```


EXAMPLE
---------------------------------------

For given `math.js` below,

```javascript
'use strict';

const assert = require('node:assert');

function add (a, b) {
    console.assert(typeof a === 'number');
    assert(!isNaN(a));
    assert.equal(typeof b, 'number');
    assert.ok(!isNaN(b));
    return a + b;
}
```

Run `browserify` with `-t unassertify` to transform file.

```
$ $(npm bin)/browserify -t unassertify /path/to/demo/math.js > /path/to/build/math.js
```

You will see assert calls disappear.

```javascript
'use strict';
function add(a, b) {
    return a + b;
}
```


SUPPORTED PATTERNS
---------------------------------------

Assertion expressions are removed when they match patterns below. In other words, unassertify removes assertion calls that are compatible with Node.js standard [assert](https://nodejs.org/api/assert.html) API (and `console.assert`).

* `assert(value, [message])`
* `assert.ok(value, [message])`
* `assert.equal(actual, expected, [message])`
* `assert.notEqual(actual, expected, [message])`
* `assert.strictEqual(actual, expected, [message])`
* `assert.notStrictEqual(actual, expected, [message])`
* `assert.deepEqual(actual, expected, [message])`
* `assert.notDeepEqual(actual, expected, [message])`
* `assert.deepStrictEqual(actual, expected, [message])`
* `assert.notDeepStrictEqual(actual, expected, [message])`
* `assert.match(string, regexp[, message])`
* `assert.doesNotMatch(string, regexp[, message])`
* `assert.throws(block, [error], [message])`
* `assert.doesNotThrow(block, [message])`
* `await assert.rejects(asyncFn, [error], [message])`
* `await assert.doesNotReject(asyncFn, [error], [message])`
* `assert.fail([message])`
* `assert.fail(actual, expected, message, operator)`
* `assert.ifError(value)`
* `console.assert(value, [message])`

unassertify also removes assert variable declarations,

* `import assert from "assert"`
* `import assert from "assert/strict"`
* `import assert from "node:assert"`
* `import assert from "node:assert/strict"`
* `import * as assert from "assert"`
* `import * as assert from "node:assert"`
* `import * as assert from "assert/strict"`
* `import * as assert from "node:assert/strict"`
* `import { strict as assert } from "assert"`
* `import { strict as assert } from "node:assert"`
* `import { default as assert } from "assert"`
* `import { default as assert } from "node:assert"`
* `const assert = require("assert")`
* `const assert = require("node:assert")`
* `const assert = require("assert/strict")`
* `const assert = require("node:assert/strict")`
* `const assert = require("assert").strict`
* `const assert = require("node:assert").strict`
* `const { strict: assert } = require("assert")`
* `const { strict: assert } = require("node:assert")`

and assignments.

* `assert = require("assert")`
* `assert = require("node:assert")`
* `assert = require("assert/strict")`
* `assert = require("node:assert/strict")`
* `assert = require("assert").strict`
* `assert = require("node:assert").strict`


#### Auto Variable Tracking

unassert automatically removes assertion calls based on their imported variable names.

So if import declaration is as follows,

* `import strictAssert, { ok, equal as eq } from 'node:assert/strict';`

unassert removes all `strictAssert`, `ok`, `eq` calls.


AUTHOR
---------------------------------------
* [Takuto Wada](https://github.com/twada)


CONTRIBUTORS
---------------------------------------
* [Renée Kooi](https://github.com/goto-bus-stop)


OUR SUPPORT POLICY
---------------------------------------

We support Node under maintenance. In other words, we stop supporting old Node version when [their maintenance ends](https://github.com/nodejs/LTS).

This means that any other environment is not supported.

NOTE: If unassertify works in any of the unsupported environments, it is purely coincidental and has no bearing on future compatibility. Use at your own risk.


LICENSE
---------------------------------------
Licensed under the [MIT](https://github.com/unassert-js/unassertify/blob/master/LICENSE) license.


[unassert-url]: https://github.com/unassert-js/unassert
[unassert-banner]: https://raw.githubusercontent.com/unassert-js/unassert-js-logo/master/banner/banner-official-fullcolor.png

[npm-url]: https://npmjs.org/package/unassertify
[npm-image]: https://badge.fury.io/js/unassertify.svg

[ci-image]: https://github.com/unassert-js/unassertify/workflows/Node.js%20CI/badge.svg
[ci-url]: https://github.com/unassert-js/unassertify/actions?query=workflow%3A%22Node.js+CI%22

[license-url]: https://github.com/unassert-js/unassertify/blob/master/LICENSE
[license-image]: https://img.shields.io/badge/license-MIT-brightgreen.svg

[style-url]: https://github.com/standard/semistandard
[style-image]: https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg
