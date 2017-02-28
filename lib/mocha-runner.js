'use babel';

/* @flow */
const Mocha = require('mocha');

export function run(textEditor) {
  console.log('run function call', textEditor);
  return new Promise((resolve) => {
    console.log('run promise create', textEditor);
    // TODO add to settings
    const mocha = new Mocha({
      ui: 'bdd',
      //reporter() {},
    });
    const results = [];

    const fileName = textEditor.getPath();
    // remove cached file https://github.com/mochajs/mocha/issues/995
    delete require.cache[fileName];
    mocha.addFile(textEditor.getPath());

    const pushTestResult = function pushTestResult(test) {
      console.log('test', test);
      if (!test || !test._trace || !test._trace.stackTrace) {
        return;
      }
      const traceObjects = test._trace.stackTrace.filter(stackTraceObject =>
        stackTraceObject.fileName === fileName);
      console.log('traceObjects', traceObjects);
      const traceObject = traceObjects.length > 0 ? traceObjects[0] : traceObjects;
      if (!traceObject) {
        return;
      }

      console.log('trace', traceObject);
      if (!test.state) {
        test.state = 'skipped';
      }
      results.push({
        state: test.state,
        text: test.title,
        range: [
          [traceObject.lineNumber - 1, traceObject.columnNumber],
          [traceObject.lineNumber - 1, traceObject.columnNumber + test.title.length],
        ],
        filePath: textEditor.getPath(),
      });
    };

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

    console.log('BEFORE mocha run', mocha);
    mocha.run((failures) => {
      resolve(results);
      console.log('AFTER mocha run', failures, results);
    })
    .on('start', (start) => {
      console.log('START', start);
    })
    .on('end', (end) => {
      console.log('END', end);
      console.log('self.results', results);
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
}
