'use babel';
/*@flow */

var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');

export function mochaRun() {
  var promise = new Promise(function(resolve, reject) {
    // TODO add to settings
    this.mocha = new Mocha({
        ui: 'bdd'
    });
    this.results = [{
      type: 'Error',
      text: 'Something went wrong',
      range: [[0,0], [0,1]],
      filePath: 'faked/path/to/file'
    }];

    // TODO add to settings
    var testDir = './test';

    fs.readdirSync(testDir)
        .filter(function (file) {
            // Only keep the .js files
            return file.substr(-3) === '.js';
        })
        .forEach(function (file) {
            this.mocha.addFile(
                path.join(testDir, file)
            );
        });

    this.runner = this.mocha.run(function (failures) {
        process.on('exit', function (exitCode) {
            if(exitCode !== 0) {
              reject(exitCode);
            }
            process.exit(failures);
        });
        process.on('SIGINT', function (error) {
            reject(error);
            process.kill('SIGINT'); // calls runner.abort()
            process.kill('SIGTERM'); // if that didn't work, we're probably in an infinite loop, so make it die.
        });
    });

    this.runner.on('start', function (start) {
        console.log('START', start);
    });
    this.runner.on('end', function (end) {
        console.log('END', end);
        resolve(results);
    });
    this.runner.on('suite', function (suite) {
        console.log('SUITE START', suite);
    });
    this.runner.on('suite end', function (suite) {
        console.log('SUITE END', suite);
    });
    this.runner.on('test', function (test) {
        console.log('TEST START', test);
    });
    this.runner.on('test end', function (test) {
        console.log('TEST END', test);
    });
    this.runner.on('hook', function (hook) {
        console.log('HOOK START', hook);
    });
    this.runner.on('hook end', function (hook) {
        console.log('HOOK END', hook);
    });
    this.runner.on('pass', function (test) {
        console.log('PASS', test);
    });
    this.runner.on('fail', function (test, error) {
        console.log('FAIL', test, error);
    });
    this.runner.on('pending', function (test) {
        console.log('PENDING', test);
    });
  });

  promise.then(function(result) {
    console.log(result); // "Stuff worked!"
    return this.results;
  }, function(err) {
    console.log(err); // Error: "It broke"
    return this.results;
  });

  return promise;
}
