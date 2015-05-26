unassertify
================================

[Browserify](http://browserify.org/) transform to remove assertions on production build. Encourages Design by Contract (DbC).


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
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var glob = require('glob'),

gulp.task('production_build', function() {
    var files = glob.sync('./src/*.js');
    var b = browserify({entries: files, debug: false});
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


AUTHOR
---------------------------------------
* [Takuto Wada](http://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](http://twada.mit-license.org/) license.
