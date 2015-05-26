/**
 * unassertify
 *   Browserify transform to remove assertions on production build
 * 
 * https://github.com/twada/unassertify
 *
 * Copyright (c) 2015 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */
'use strict';

var through = require('through');

function isDebugMode (filepath, options) {
    return (options && options._flags && options._flags.debug);
}

module.exports = function unassertify (filepath, options) {
	if (isDebugMode(filepath, options)) {
        return through();
    }

    var data = '',
        stream = through(write, end);

    function write(buf) {
        data += buf;
    }

    function end() {
        stream.queue(null);
    }

    return stream;
};
