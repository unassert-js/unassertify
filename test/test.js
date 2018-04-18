'use strict';

var unassertify = require('..');
var fs = require('fs');
var path = require('path');
var Stream = require('stream');
var assert = require('power-assert');
var browserify = require('browserify');
var coffeeify = require('coffeeify');
var es = require('event-stream');
var convert = require('convert-source-map');


describe('unassertify', function () {
    it('removes assert dependency', function (done) {
        var b = browserify();
        b.add(path.normalize(path.join(__dirname, 'fixtures', 'func', 'fixture.js')));
        b.transform(unassertify);
        b.bundle().pipe(es.wait(function(err, data) {
            assert(!err);
            var code = data.toString('utf-8');
            // console.log(code);
            assert(! /assert/.test(code));
            done();
        }));
    });
    it('produces sourcemap when debug: true', function (done) {
        var b = browserify({debug: true});
        var testFilepath = path.normalize(path.join(__dirname, 'fixtures', 'func', 'fixture.js'));
        b.add(testFilepath);
        b.transform(unassertify);
        b.bundle().pipe(es.wait(function(err, data) {
            assert(!err);
            var code = data.toString('utf-8');
            // console.log(code);
            assert(! /assert/.test(code));
            var inlineMap = convert.fromSource(code);
            assert(inlineMap);
            var sourceMap = inlineMap.toObject();
            assert(sourceMap);
            // console.log(JSON.stringify(sourceMap, null, 2));
            assert(sourceMap.sources.some(function (fpath) { return fpath === testFilepath; }));
            done();
        }));
    });
    it('skips files that do not contain assertions', function (done) {
        var filename = path.join(__dirname, 'fixtures', 'func', 'no-assert.js');
        fs.createReadStream(filename)
            .pipe(unassertify(filename, {}))
            .pipe(es.wait(function(err, data) {
                assert(!err);
                var code = data.toString('utf-8');
                assert(! /assert/.test(code));
                done();
            }));
    });
});


describe('with preceding transform', function () {
    it('just remove assertions and dependencies when debug: false', function (done) {
        var b = browserify();
        b.add(path.normalize(path.join(__dirname, 'fixtures', 'coffee', 'fixture.coffee')));
        b.transform(coffeeify);
        b.transform(unassertify);
        b.bundle().pipe(es.wait(function(err, data) {
            assert(!err);
            var code = data.toString('utf-8');
            // console.log(code);
            var inlineMap = convert.fromSource(code);
            assert(!inlineMap);
            assert(! /require\('assert'\)/.test(code));
            done();
        }));
    });
    it('adjust sourcemap if debug: true', function (done) {
        var b = browserify({debug: true});
        var testFilepath = path.normalize(path.join(__dirname, 'fixtures', 'coffee', 'fixture.coffee'));
        b.add(testFilepath);
        b.transform(coffeeify);
        b.transform(unassertify);
        b.bundle().pipe(es.wait(function(err, data) {
            assert(!err);
            var code = data.toString('utf-8');
            // console.log(code);
            assert(! /require\('assert'\)/.test(code));
            var inlineMap = convert.fromSource(code);
            assert(inlineMap);
            var sourceMap = inlineMap.toObject();
            assert(sourceMap);
            // console.log(JSON.stringify(sourceMap, null, 2));
            assert(sourceMap.sources.some(function (fpath) { return testFilepath.lastIndexOf(fpath) !== -1; }));
            var originalCode = fs.readFileSync(testFilepath, 'utf-8');
            assert(sourceMap.sourcesContent.some(function (eachCode) {
                return eachCode === originalCode;
            }));
            done();
        }));
    });
});


describe('adjust sourcemap if debug: true', function() {
    var stream = unassertify(
        '/absolute/path/to/test/fixtures/func/fixture.js',
        {
            _flags: {
                entries: [
                    './test/fixtures/func/fixture.js'
                ],
                debug: true
            }
        });
    
    it('should return a stream', function() {
        assert(stream instanceof Stream);
    });
    
    it('should not transform', function(done) {
        var output = '', file;
        stream.on('data', function(buf) {
            output += buf;
        });
        stream.on('end', function() {
            var expected = fs.readFileSync('test/fixtures/func/expected-with-sourcemap.js', 'utf8');
            assert.equal(output, expected);
            done();
        });
        file = fs.createReadStream('test/fixtures/func/fixture.js');
        file.pipe(stream);
    });
});


describe('just remove assertions if debug: false', function() {
    var stream = unassertify(
        '/absolute/path/to/test/fixtures/func/fixture.js',
        {
            _flags: {
                entries: [
                    './test/fixtures/func/fixture.js'
                ],
                debug: false
            }
        });
    
    it('should return a stream', function() {
        assert(stream instanceof Stream);
    });
    
    it('should remove assertions', function(done) {
        var output = '', file;
        stream.on('data', function(buf) {
            output += buf;
        });
        stream.on('end', function() {
            var expected = fs.readFileSync('test/fixtures/func/expected.js', 'utf8');
            assert.equal(output, expected);
            done();
        });
        file = fs.createReadStream('test/fixtures/func/fixture.js');
        file.pipe(stream);
    });
});


describe('when incoming code is JSON file', function() {
    var stream = unassertify(
        process.cwd() + '/test/fixtures/data.json',
        {
            _flags: {
                basedir: '/absolute/path/to',
                cache: {},
                debug: true
            }
        }
    );
    
    it('should return a stream', function() {
        assert(stream instanceof Stream);
    });
    
    it('should not transform', function(done) {
        var output = '', file;
        stream.on('data', function(buf) {
            output += buf;
        });
        stream.on('end', function() {
            var expected = fs.readFileSync('test/fixtures/data.json', 'utf8');
            assert.equal(output, expected);
            done();
        });
        file = fs.createReadStream('test/fixtures/data.json');
        file.pipe(stream);
    });
});


describe('when incoming code contains #! hash bang', function() {
    var stream = unassertify(
        '/tmp/JSONStream.js',
        { _flags: {} }
    );

    it('should ignore hashbang', function(done) {
        var output = '';
        stream.on('data', function(buf) {
            output += buf;
        });
        stream.on('end', function() {
            // We didn't crash while parsing!
            done();
        });
        stream.end('#!/usr/bin/env node\n\nvar assert = require("assert"); assert(10 == 10);');
    });
});
