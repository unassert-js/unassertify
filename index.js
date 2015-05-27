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
var esprima = require('esprima');
var escodegen = require('escodegen');
var unassert = require('unassert');

function isDebugMode (filepath, options) {
    return (options && options._flags && options._flags.debug);
}

function applyUnassert (code, options) {
    var ast = esprima.parse(code);
    return escodegen.generate(unassert(ast));
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
        stream.queue(applyUnassert(data, options));
        stream.queue(null);
    }

    return stream;
};
