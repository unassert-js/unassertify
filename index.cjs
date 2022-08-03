/**
 * unassertify
 *   Browserify transform for unassert
 *     Encourages programming with assertions by providing tools to compile them away.
 *
 * https://github.com/unassert-js/unassertify
 *
 * Copyright (c) 2015-2022 Takuto Wada
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
const { unassertAst, defaultOptions } = require('unassert');
const hasOwn = Object.prototype.hasOwnProperty;

// add `power-assert` to target modules to avoid breaking change since unassertify is not configurable well
function generateUnassertifyOptions () {
  const opts = defaultOptions();
  opts.modules.push('power-assert');
  return opts;
}

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

function applyUnassertWithSourceMap (code, filepath, unassertOptions) {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
    locations: true,
    allowHashBang: true
  });
  const inMap = handleIncomingSourceMap(code);
  const instrumented = escodegen.generate(unassertAst(ast, unassertOptions), {
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

function applyUnassertWithoutSourceMap (code, unassertOptions) {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
    allowHashBang: true
  });
  return escodegen.generate(unassertAst(ast, unassertOptions));
}

function shouldProduceSourceMap (options) {
  return (options && options._flags && options._flags.debug);
}

function containsAssertions (src) {
  // Matches 'assert','assert/strict','node:assert','node:assert/strict' and 'power-assert'
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
      stream.queue(applyUnassertWithSourceMap(data, filepath, generateUnassertifyOptions()));
    } else {
      stream.queue(applyUnassertWithoutSourceMap(data, generateUnassertifyOptions()));
    }
    stream.queue(null);
  }

  return stream;
};
