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
var convert = require('convert-source-map');
var transfer = require('multi-stage-sourcemap').transfer;
var unassert = require('unassert');

function mergeSourceMap (incomingSourceMap, outgoingSourceMap) {
    if (typeof outgoingSourceMap === 'string' || outgoingSourceMap instanceof String) {
        outgoingSourceMap = JSON.parse(outgoingSourceMap);
    }
    if (!incomingSourceMap) {
        return outgoingSourceMap;
    }
    return JSON.parse(transfer({fromSourceMap: outgoingSourceMap, toSourceMap: incomingSourceMap}));
}

function handleIncomingSourceMap (originalCode) {
    var commented = convert.fromSource(originalCode);
    if (commented) {
        return commented.toObject();
    }
    return null;
}

function applyUnassertWithSourceMap (code, filepath, options) {
    var ast = esprima.parse(code, { sourceType: 'module' });
    var inMap = handleIncomingSourceMap(code);
    var instrumented = escodegen.generate(unassert(ast), {
        sourceMap: filepath,
        sourceContent: code,
        sourceMapWithCode: true
    });
    var outMap = convert.fromJSON(instrumented.map.toString());
    if (inMap) {
        var mergedRawMap = mergeSourceMap(inMap, outMap.toObject());
        var reMap = convert.fromObject(mergedRawMap);
        if (inMap.sources) {
            reMap.setProperty('sources', inMap.sources);
        }
        if (inMap.sourceRoot) {
            reMap.setProperty('sourceRoot', inMap.sourceRoot);
        }
        if (inMap.sourcesContent) {
            reMap.setProperty('sourcesContent', inMap.sourcesContent);
        }
        return instrumented.code + '\n' + reMap.toComment() + '\n';
    } else {
        return instrumented.code + '\n' + outMap.toComment() + '\n';
    }
}

function applyUnassertWithoutSourceMap (code, filepath, options) {
    var ast = esprima.parse(code, { sourceType: 'module' });
    return escodegen.generate(unassert(ast));
}

function isDebugMode (options) {
    return (options && options._flags && options._flags.debug);
}

module.exports = function unassertify (filepath, options) {
    var data = '',
        stream = through(write, end);

    function write(buf) {
        data += buf;
    }

    function end() {
        if (isDebugMode(options)) {
            stream.queue(applyUnassertWithSourceMap(data, filepath, options));
        } else {
            stream.queue(applyUnassertWithoutSourceMap(data, filepath, options));
        }        
        stream.queue(null);
    }

    return stream;
};
