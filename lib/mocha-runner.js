'use babel';

/* @flow */
const fs = require('fs');
const path = require('path');
const Mocha = require('mocha');
const ErrorStackParser = require('error-stack-parser');

export function run(textEditor) {
  console.log('run function call', textEditor);
  return new Promise((resolve) => {
    console.log('run promise create', textEditor);
    const write = process.stdout.write;
    let output = 'Mocha Runner:\n\n';
    process.stdout.write = function (str) {
      output += str;
    };
    // TODO add to settings
    const mocha = new Mocha({
      ui: 'bdd',
      reporter: 'spec',
      // bail: true,
      // require: 'babelhook'
    });
    const messages = [];

    const fileModified = textEditor.isModified();
    const fileName = textEditor.getPath();
    let outputFilePath = fileName;
    if (fileModified) {
      const outputDir = `${atom.getConfigDirPath()}/tester-mocha`;
      if (!fs.existsSync(outputDir)) {
        fs.mkdir(outputDir);
      }
      outputFilePath = `${outputDir}/${path.basename(fileName)}`;
      fs.writeFileSync(outputFilePath, textEditor.getText());
      console.log('WRITE TEMP FILE', outputFilePath, textEditor.getText());
    }

    // remove cached file https://github.com/mochajs/mocha/issues/995
    delete require.cache[outputFilePath];
    mocha.addFile(outputFilePath);

    const pushTestResult = function pushTestResult(test) {
      console.log('++++pushTestResult', test);
      console.log('++++pushTestResult _trace', test._trace);
      if (!test || !test._trace) {
        console.log('++++test trace is empty', test);
        return;
      }
      const traceObjects = ErrorStackParser.parse(test._trace)
        .filter(stackTraceObject => stackTraceObject.fileName === outputFilePath);
      console.log('++++traceObjects', traceObjects);
      const traceObject = traceObjects.length > 0 ? traceObjects[0] : traceObjects;
      if (!traceObject) {
        console.log('++++traceObject is empty', test);
        return;
      }

      console.log('++++trace', traceObject);
      if (!test.state) {
        test.state = 'skipped';
      }
      messages.push({
        state: test.state,
        title: test.title,
        error: test.err,
        duration: test.duration,
        lineNumber: traceObject.lineNumber - 1,
        filePath: textEditor.getPath(),
      });
      console.log('++++ADDED TO RESULTS', messages);
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
      process.stdout.write = write;
      if (fileModified && fs.existsSync(outputFilePath)) {
        fs.unlink(outputFilePath);
      }
      resolve({ messages, output });
      console.log('AFTER mocha run', failures, messages, output);
    })
    .on('start', (start) => {
      console.log('START', start);
    })
    .on('end', (end) => {
      console.log('END', end);
      console.log('self.results', messages);
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
