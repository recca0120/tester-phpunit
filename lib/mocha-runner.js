'use babel';

/* @flow */
const Mocha = require('mocha');

export function run(textEditor) {
  const promise = new Promise((resolve) => {
    // TODO add to settings
    const mocha = new Mocha({
      ui: 'bdd',
      //reporter() {},
    });
    const results = [];

    const fileName = textEditor.getPath();
    const pushTestResult = function pushTestResult(test) {
      console.log('test', test);
      console.log('test._trace', test._trace);
      console.log('test._trace.stackTrace', test._trace.stackTrace);
      if (!test || !test._trace || !test._trace.stackTrace) {
        return;
      }
      const traceObject = test._trace.stackTrace.filter((stackTraceObject) => {
        console.log('stackTraceObject', stackTraceObject);
        return stackTraceObject.fileName === fileName;
      }).shift();

      if (!traceObject) {
        return;
      }

      console.log('trace', traceObject);
      results.push({
        type: test.state,
        text: test.title,
        range: [
          [traceObject.lineNumber, traceObject.columnNumber],
          [traceObject.lineNumber, traceObject.columnNumber + test.title.length],
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

    mocha.run()
    .on('start', (start) => {
      console.log('START', start);
    })
    .on('end', (end) => {
      console.log('END', end);
      console.log('self.results', results);
      resolve(results);
    })
    .on('suite', (suite) => {
      console.log('SUITE START', suite);
    })
    .on('suite end', (suite) => {
      console.log('SUITE END', suite);
    })
    .on('test', (test) => {
      console.log('TEST START', test);
    })
    .on('test end', (test) => {
      console.log('TEST END', test);
    })
    .on('hook', (hook) => {
      console.log('HOOK START', hook);
    })
    .on('hook end', (hook) => {
      console.log('HOOK END', hook);
    })
    .on('pass', (test) => {
      pushTestResult(test);
      console.log('PASS', test);
    })
    .on('fail', (test, error) => {
      pushTestResult(test);
      console.log('FAIL', test, error);
    })
    .on('pending', (test) => {
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
