'use strict';

const Base = require('mocha').reporters.Base;
const os = require('os');
const util = require('util');
const ErrorStackParser = require('error-stack-parser');

let outputFilePath = '';

function clean(test) {
  if (!test || !test._trace) {
    return;
  }
  const traceObjects = ErrorStackParser.parse(test._trace)
    .filter(stackTraceObject => stackTraceObject.fileName === outputFilePath);
  const traceObject = traceObjects.length > 0 ? traceObjects[0] : traceObjects;
  if (!traceObject) {
    return;
  }

  if (!test.state) {
    test.state = 'skipped';
  }
  return {
    state: test.state,
    title: test.title,
    error: test.err,
    duration: test.duration,
    lineNumber: traceObject.lineNumber - 1,
    filePath: outputFilePath,
  };
}

function logEvent(jsonEventModel) {
  return JSON.stringify(jsonEventModel) + os.EOL;
}

function jsonReporter(runner) {
  Base.call(this, runner);

  const self = this;

  const color = Base.color;
  let indents = 0;
  let n = 0;

  function indent() {
    return Array(indents).join('  ');
  }

  runner.on('start', () => {
    process.stdout.write(os.EOL);
  });

  runner.on('suite', (suite) => {
    ++indents;
    process.stdout.write(util.format(color('suite', `%s%s${os.EOL}`), indent(), suite.title));
  });

  runner.on('suite end', () => {
    --indents;
    if (indents === 1) {
      process.stdout.write(os.EOL);
    }
  });

  runner.on('test', (test) => {
    outputFilePath = test.file;
  });

  runner.on('pending', (test) => {
    const fmt = indent() + color('pending', `  - %s${os.EOL}`);
    process.stdout.write(util.format(fmt, test.title));
    process.stdout.write(logEvent(['pending_test', clean(test)]));
  });

  runner.on('pass', (test) => {
    let fmt;
    if (test.speed === 'fast') {
      fmt = indent() +
        color('checkmark', `  ${Base.symbols.ok}`) +
        color('pass', ` %s${os.EOL}`);
      process.stdout.write(util.format(fmt, test.title));
    } else {
      fmt = indent() +
        color('checkmark', `  ${Base.symbols.ok}`) +
        color('pass', ' %s') +
        color(test.speed, ` (%dms)${os.EOL}`);
      process.stdout.write(util.format(fmt, test.title, test.duration));
    }
    process.stdout.write(logEvent(['pass_test', clean(test)]));
  });

  runner.on('fail', (test) => {
    process.stdout.write(util.format(indent() + color('fail', `  %d) %s${os.EOL}`), ++n, test.title));
    process.stdout.write(logEvent(['fail_test', clean(test)]));
  });

  runner.on('end', () => {
    self.epilogue();
    process.stdout.write(logEvent(['end', self.stats]));
  });
}

util.inherits(jsonReporter, Base);
module.exports = jsonReporter;
