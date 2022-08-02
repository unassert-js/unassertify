'use strict';

const unassertify = require('..');
const fs = require('fs');
const path = require('path');
const Stream = require('stream');
const assert = require('power-assert');
const browserify = require('browserify');
const coffeeify = require('coffeeify');
const es = require('event-stream');
const convert = require('convert-source-map');

describe('unassertify', function () {
  it('removes assert dependency', function (done) {
    const b = browserify();
    b.add(path.normalize(path.join(__dirname, 'fixtures', 'func', 'fixture.js')));
    b.transform(unassertify);
    b.bundle().pipe(es.wait(function (err, data) {
      assert(!err);
      const code = data.toString('utf-8');
      // console.log(code);
      assert(!/assert/.test(code));
      done();
    }));
  });
  it('produces sourcemap when debug: true', function (done) {
    const b = browserify({ debug: true });
    const testFilepath = path.normalize(path.join(__dirname, 'fixtures', 'func', 'fixture.js'));
    b.add(testFilepath);
    b.transform(unassertify);
    b.bundle().pipe(es.wait(function (err, data) {
      assert(!err);
      const code = data.toString('utf-8');
      // console.log(code);
      assert(!/assert/.test(code));
      const inlineMap = convert.fromSource(code);
      assert(inlineMap);
      const sourceMap = inlineMap.toObject();
      assert(sourceMap);
      // console.log(JSON.stringify(sourceMap, null, 2));
      assert(sourceMap.sources.some(function (fpath) { return fpath === testFilepath; }));
      done();
    }));
  });
  it('skips files that do not contain assertions', function (done) {
    const filename = path.join(__dirname, 'fixtures', 'func', 'no-assert.js');
    fs.createReadStream(filename)
      .pipe(unassertify(filename, {}))
      .pipe(es.wait(function (err, data) {
        assert(!err);
        const code = data.toString('utf-8');
        assert(!/assert/.test(code));
        done();
      }));
  });
});

describe('with preceding transform', function () {
  it('just remove assertions and dependencies when debug: false', function (done) {
    const b = browserify();
    b.add(path.normalize(path.join(__dirname, 'fixtures', 'coffee', 'fixture.coffee')));
    b.transform(coffeeify);
    b.transform(unassertify);
    b.bundle().pipe(es.wait(function (err, data) {
      assert(!err);
      const code = data.toString('utf-8');
      // console.log(code);
      const inlineMap = convert.fromSource(code);
      assert(!inlineMap);
      assert(!/require\('assert'\)/.test(code));
      done();
    }));
  });
  it('adjust sourcemap if debug: true', function (done) {
    const b = browserify({ debug: true });
    const testFilepath = path.normalize(path.join(__dirname, 'fixtures', 'coffee', 'fixture.coffee'));
    b.add(testFilepath);
    b.transform(coffeeify);
    b.transform(unassertify);
    b.bundle().pipe(es.wait(function (err, data) {
      assert(!err);
      const code = data.toString('utf-8');
      // console.log(code);
      assert(!/require\('assert'\)/.test(code));
      const inlineMap = convert.fromSource(code);
      assert(inlineMap);
      const sourceMap = inlineMap.toObject();
      assert(sourceMap);
      // console.log(JSON.stringify(sourceMap, null, 2));
      assert(sourceMap.sources.some(function (fpath) { return testFilepath.lastIndexOf(fpath) !== -1; }));
      const originalCode = fs.readFileSync(testFilepath, 'utf-8');
      assert(sourceMap.sourcesContent.some(function (eachCode) {
        return eachCode === originalCode;
      }));
      done();
    }));
  });
});

describe('adjust sourcemap if debug: true', function () {
  const stream = unassertify(
    '/absolute/path/to/test/fixtures/func/fixture.js',
    {
      _flags: {
        entries: [
          './test/fixtures/func/fixture.js'
        ],
        debug: true
      }
    });

  it('should return a stream', function () {
    assert(stream instanceof Stream);
  });

  it('should not transform', function (done) {
    let output = '';
    stream.on('data', function (buf) {
      output += buf;
    });
    stream.on('end', function () {
      const expected = fs.readFileSync('test/fixtures/func/expected-with-sourcemap.js', 'utf8');
      assert.equal(output, expected);
      done();
    });
    const file = fs.createReadStream('test/fixtures/func/fixture.js');
    file.pipe(stream);
  });
});

describe('just remove assertions if debug: false', function () {
  const stream = unassertify(
    '/absolute/path/to/test/fixtures/func/fixture.js',
    {
      _flags: {
        entries: [
          './test/fixtures/func/fixture.js'
        ],
        debug: false
      }
    });

  it('should return a stream', function () {
    assert(stream instanceof Stream);
  });

  it('should remove assertions', function (done) {
    let output = '';
    stream.on('data', function (buf) {
      output += buf;
    });
    stream.on('end', function () {
      const expected = fs.readFileSync('test/fixtures/func/expected.js', 'utf8');
      assert.equal(output, expected);
      done();
    });
    const file = fs.createReadStream('test/fixtures/func/fixture.js');
    file.pipe(stream);
  });
});

describe('when incoming code is JSON file', function () {
  const stream = unassertify(
    process.cwd() + '/test/fixtures/data.json',
    {
      _flags: {
        basedir: '/absolute/path/to',
        cache: {},
        debug: true
      }
    }
  );

  it('should return a stream', function () {
    assert(stream instanceof Stream);
  });

  it('should not transform', function (done) {
    let output = '';
    stream.on('data', function (buf) {
      output += buf;
    });
    stream.on('end', function () {
      const expected = fs.readFileSync('test/fixtures/data.json', 'utf8');
      assert.equal(output, expected);
      done();
    });
    const file = fs.createReadStream('test/fixtures/data.json');
    file.pipe(stream);
  });
});

describe('when incoming code contains #! hash bang', function () {
  const stream = unassertify(
    '/tmp/JSONStream.js',
    { _flags: {} }
  );

  it('should ignore hashbang', function (done) {
    stream.on('end', function () {
      // We didn't crash while parsing!
      done();
    });
    stream.end('#!/usr/bin/env node\n\nvar assert = require("assert"); assert(10 == 10);');
  });
});
