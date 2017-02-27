'use babel';

/* @flow */

const Mocha = require('mocha');
// const fs = require('fs');
// const path = require('path');

export function run(textEditor) {
  const promise = new Promise(function (resolve, reject) {
    // TODO add to settings
    this.mocha = new Mocha({
      ui: 'bdd',
    });
    this.results = [{
      type: 'Error',
      text: 'Something went wrong',
      range: [[0, 0], [0, 1]],
      filePath: textEditor.getPath(),
    }];

    this.fileName = textEditor.getPath();
    this.mocha.addFile(textEditor.getPath());
    // TODO add to settings
    // const testDir = './test';

    /* fs.readdirSync(testDir)
        .filter(file =>
            // Only keep the .js files
           file.substr(-3) === '.js')
        .forEach(function (file) {
          this.mocha.addFile(
                path.join(testDir, file),
            );
        });*/

    this.runner = this.mocha.run((failures) => {
      process.on('exit', (exitCode) => {
        if (exitCode !== 0) {
          reject(exitCode);
        }
        process.exit(failures);
      });
      process.on('SIGINT', (error) => {
        reject(error);
        process.kill('SIGINT'); // calls runner.abort()
        process.kill('SIGTERM'); // if that didn't work, we're probably in an infinite loop, so make it die.
      });
    });

    const self = this;
    this.runner.on('start', (start) => {
      console.log('START', start);
    });
    this.runner.on('end', (end) => {
      console.log('END', end);
      resolve(this.results);
    });
    this.runner.on('suite', (suite) => {
      console.log('SUITE START', suite);
    });
    this.runner.on('suite end', (suite) => {
      console.log('SUITE END', suite);
    });
    this.runner.on('test', (test) => {
      console.log('TEST START', test);
    });
    this.runner.on('test end', (test) => {
      console.log('TEST END', test);
    });
    this.runner.on('hook', (hook) => {
      console.log('HOOK START', hook);
    });
    this.runner.on('hook end', (hook) => {
      console.log('HOOK END', hook);
    });
    this.runner.on('pass', (test) => {
      this.pushTestResult(test);
      console.log('PASS', test);
    });
    this.runner.on('fail', (test, error) => {
      this.pushTestResult(test);
      console.log('FAIL', test, error);
    });
    this.runner.on('pending', (test) => {
      this.pushTestResult(test);
      console.log('PENDING', test);
    });

    this.pushTestResult = function pushTestResult(test) {
      const trace = test.stackTrace.filter(stackTraceObject =>
        stackTraceObject.fileName === self.fileName);
      console.log('trace', trace);
      self.results.push({
        type: test.state,
        text: test.title,
        range: [
          [trace.lineNumber, trace.columnNumber],
          [trace.lineNumber, trace.columnNumber + test.title.length],
        ],
        filePath: textEditor.getPath(),
      });
    };
  });

  promise.then(function (result) {
    console.log(result); // "Stuff worked!"
    return this.results;
  }, function (err) {
    console.log(err); // Error: "It broke"
    return this.results;
  });

  return promise;
}
