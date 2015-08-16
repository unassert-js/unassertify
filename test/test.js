'use strict';

var unassertify = require('..');
var fs = require('fs');
var path = require('path');
var Stream = require('stream');
var assert = require('assert');
var browserify = require('browserify');
var es = require('event-stream');


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
});


describe('do nothing if debug: true', function() {
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
            var expected = fs.readFileSync('test/fixtures/func/fixture.js', 'utf8');
            assert.equal(output, expected);
            done();
        });
        file = fs.createReadStream('test/fixtures/func/fixture.js');
        file.pipe(stream);
    });
});


describe('remove assertions if debug: false', function() {
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
