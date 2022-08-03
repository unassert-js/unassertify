/**
 * unassertify
 *   Browserify transform for unassert
 *     Encourages programming with assertions by providing tools to compile them away.
 *
 * https://github.com/unassert-js/unassertify
 *
 * Copyright (c) 2015-2018 Takuto Wada
 * Licensed under the MIT license.
 *   https://github.com/unassert-js/unassertify/blob/master/LICENSE
 */
'use strict';

const path = require('path');
const through = require('through');
const acorn = require('acorn');
const escodegen = require('escodegen');
const convert = require('convert-source-map');
const { transfer } = require('multi-stage-sourcemap');
const { unassertAst } = require('unassert');
const hasOwn = Object.prototype.hasOwnProperty;

function mergeSourceMap (incomingSourceMap, outgoingSourceMap) {
  if (typeof outgoingSourceMap === 'string' || outgoingSourceMap instanceof String) {
    outgoingSourceMap = JSON.parse(outgoingSourceMap);
  }
  if (!incomingSourceMap) {
    return outgoingSourceMap;
  }
  return JSON.parse(transfer({ fromSourceMap: outgoingSourceMap, toSourceMap: incomingSourceMap }));
}

function overwritePropertyIfExists (name, from, to) {
  if (hasOwn.call(from, name)) {
    to.setProperty(name, from[name]);
  }
}

function reconnectSourceMap (inMap, outMap) {
  const mergedRawMap = mergeSourceMap(inMap, outMap.toObject());
  const reMap = convert.fromObject(mergedRawMap);
  overwritePropertyIfExists('sources', inMap, reMap);
  overwritePropertyIfExists('sourceRoot', inMap, reMap);
  overwritePropertyIfExists('sourcesContent', inMap, reMap);
  return reMap;
}

function handleIncomingSourceMap (originalCode) {
  const commented = convert.fromSource(originalCode);
  if (commented) {
    return commented.toObject();
  }
  return null;
}

function applyUnassertWithSourceMap (code, filepath) {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
    locations: true,
    allowHashBang: true
  });
  const inMap = handleIncomingSourceMap(code);
  const instrumented = escodegen.generate(unassertAst(ast), {
    sourceMap: filepath,
    sourceContent: code,
    sourceMapWithCode: true
  });
  const outMap = convert.fromJSON(instrumented.map.toString());
  if (inMap) {
    const reMap = reconnectSourceMap(inMap, outMap);
    return instrumented.code + '\n' + reMap.toComment() + '\n';
  } else {
    return instrumented.code + '\n' + outMap.toComment() + '\n';
  }
}

function applyUnassertWithoutSourceMap (code) {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
    allowHashBang: true
  });
  return escodegen.generate(unassertAst(ast));
}

function shouldProduceSourceMap (options) {
  return (options && options._flags && options._flags.debug);
}

function containsAssertions (src) {
  // Matches both `assert` and `power-assert`.
  return src.indexOf('assert') !== -1;
}

module.exports = function unassertify (filepath, options) {
  if (path.extname(filepath) === '.json') {
    return through();
  }

  let data = '';
  const stream = through(write, end);

  function write (buf) {
    data += buf;
  }

  function end () {
    if (!containsAssertions(data)) {
      stream.queue(data);
    } else if (shouldProduceSourceMap(options)) {
      stream.queue(applyUnassertWithSourceMap(data, filepath));
    } else {
      stream.queue(applyUnassertWithoutSourceMap(data));
    }
    stream.queue(null);
  }

  return stream;
};
