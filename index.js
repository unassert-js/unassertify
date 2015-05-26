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
var estraverse = require('estraverse');
var escallmatch = require('escallmatch');
var patterns = [
    'assert(value, [message])',
    'assert.ok(value, [message])',
    'assert.equal(actual, expected, [message])',
    'assert.notEqual(actual, expected, [message])',
    'assert.strictEqual(actual, expected, [message])',
    'assert.notStrictEqual(actual, expected, [message])',
    'assert.deepEqual(actual, expected, [message])',
    'assert.notDeepEqual(actual, expected, [message])',
    'assert.deepStrictEqual(actual, expected, [message])',
    'assert.notDeepStrictEqual(actual, expected, [message])',
    'assert.fail(actual, expected, message, operator)',
    'assert.throws(block, [error], [message])',
    'assert.doesNotThrow(block, [message])',
    'assert.ifError(value)',
    'console.assert(value, [message])'
];
var matchers = patterns.map(escallmatch);

function isDebugMode (filepath, options) {
    return (options && options._flags && options._flags.debug);
}

function matches (node) {
    return function (matcher) {
        return matcher.test(node);
    };
}

function parentPath (controller) {
    return controller.path().slice(0, -1).join('/');
}

function unassert (code, options) {
    var pathToRemove = {};
    var ast = esprima.parse(code);
    estraverse.replace(ast, {
        enter: function (currentNode, parentNode) {
            if (matchers.some(matches(currentNode))) {
                pathToRemove[parentPath(this)] = true;
            }
        },
        leave: function (currentNode, parentNode) {
            if (this.path() && pathToRemove[this.path().join('/')]) {
                this.remove();
            }
        }
    });
    return escodegen.generate(ast);
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
        stream.queue(unassert(data, options));
        stream.queue(null);
    }

    return stream;
};
