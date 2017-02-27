'use babel';
var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');

// TODO add to settings
var mocha = new Mocha({
    ui: 'bdd'
});

// TODO add to settings
var testDir = './test';

fs.readdirSync(testDir)
    .filter(function (file) {
        // Only keep the .js files
        return file.substr(-3) === '.js';
    })
    .forEach(function (file) {
        mocha.addFile(
            path.join(testDir, file)
        );
    });

var runner = mocha.run(function (failures) {
    process.on('exit', function () {
        process.exit(failures);
    });
    process.on('SIGINT', function () {
        process.kill('SIGINT'); // calls runner.abort()
        process.kill('SIGTERM'); // if that didn't work, we're probably in an infinite loop, so make it die.
    });
});

runner.on('start', function (start) {
    console.log('START', start);
});
runner.on('end', function (end) {
    console.log('END', end);
});
runner.on('suite', function (suite) {
    console.log('SUITE START', suite);
});
runner.on('suite end', function (suite) {
    console.log('SUITE END', suite);
});
runner.on('test', function (test) {
    console.log('TEST START', test);
});
runner.on('test end', function (test) {
    console.log('TEST END', test);
});
runner.on('hook', function (hook) {
    console.log('HOOK START', hook);
});
runner.on('hook end', function (hook) {
    console.log('HOOK END', hook);
});
runner.on('pass', function (test) {
    console.log('PASS', test);
});
runner.on('fail', function (test, error) {
    console.log('FAIL', test, error);
});
runner.on('pending', function (test) {
    console.log('PENDING', test);
});
