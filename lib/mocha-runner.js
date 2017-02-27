'use babel';

/* @flow */
const Base = require('mocha').reporters.Base;
const Mocha = require('mocha');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  console.log(line);
});

export function run(textEditor) {
  const promise = new Promise((resolve, reject) => {
    // TODO add to settings
    const mocha = new Mocha({
      ui: 'bdd',
      //reporter() {},
    });
    const results = [{
      type: 'Error',
      text: 'Something went wrong',
      range: [[0, 0], [0, 1]],
      filePath: textEditor.getPath(),
    }];

    const fileName = textEditor.getPath();
    const pushTestResult = function pushTestResult(test) {
      const trace = test.stackTrace.filter(stackTraceObject =>
        stackTraceObject.fileName === fileName);
      console.log('trace', trace);
      results.push({
        type: test.state,
        text: test.title,
        range: [
          [trace.lineNumber, trace.columnNumber],
          [trace.lineNumber, trace.columnNumber + test.title.length],
        ],
        filePath: textEditor.getPath(),
      });
    };

    mocha.addFile(textEditor.getPath());
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

    const runner = mocha.run((failures) => {
      console.log('process', process);
      process.on('exit', (exitCode) => {
        console.log('process.exit', failures, exitCode);
        if (exitCode !== 0) {
          reject(exitCode);
        }
        process.exit(failures);
      });
      process.on('SIGINT', (error) => {
        console.log('SIGINT', error);
        reject(error);
        process.kill('SIGINT'); // calls runner.abort()
        process.kill('SIGTERM'); // if that didn't work, we're probably in an infinite loop, so make it die.
      });
      process.on('uncaughtException', (error) => {
        console.log('uncaughtException', error);
      });
    });

    Base.call(this, runner);
    runner.on('start', (start) => {
      console.log('START', start);
    });
    runner.on('end', (end) => {
      console.log('END', end);
      console.log('self.results', results);
      // resolve(this.results);
    });
    runner.on('suite', (suite) => {
      console.log('SUITE START', suite);
    });
    runner.on('suite end', (suite) => {
      console.log('SUITE END', suite);
    });
    runner.on('test', (test) => {
      console.log('TEST START', test);
    });
    runner.on('test end', (test) => {
      console.log('TEST END', test);
    });
    runner.on('hook', (hook) => {
      console.log('HOOK START', hook);
    });
    runner.on('hook end', (hook) => {
      console.log('HOOK END', hook);
    });
    runner.on('pass', (test) => {
      pushTestResult(test);
      console.log('PASS', test);
    });
    runner.on('fail', (test, error) => {
      pushTestResult(test);
      console.log('FAIL', test, error);
    });
    runner.on('pending', (test) => {
      pushTestResult(test);
      console.log('PENDING', test);
    });
  });

  promise
    .then(function (result) {
      console.log(result); // "Stuff worked!"
      return this.results;
    })
    .catch(function (err) {
      console.log(err); // Error: "It broke"
      return this.results;
    });

  return promise;
}
