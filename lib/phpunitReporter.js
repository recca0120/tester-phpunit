'use babel';

import * as fs from 'fs';
import { parseString } from 'xml2js';

function lf(str) {
  return str.replace(/\r\n/g, '\n');
}

function parseState(errAttr) {
  const type = errAttr.type.toLowerCase();

  if (type.indexOf('skipped') !== -1) {
    return 'skipped';
  }

  if (type.indexOf('incomplete') !== -1) {
    return 'incomplete';
  }

  if (type.indexOf('failed') !== -1) {
    return 'failed';
  }

  return 'error';
}

function parseFiles(errorChar) {
  return errorChar.split('\n')
    .map(line => line.trim())
    .filter(line => /(.*):(\d+)/.test(line));
}

function replaceFirst(str, search) {
  const length = str.indexOf(search);

  return length === -1 ? str : str.substr(length + search.length);
}

function parseMessage(message, files, name, title) {
  message = lf(message);
  files.forEach(line => message = message.replace(line, ''));
  message = message.replace(/\n+$/, '');
  message = replaceFirst(message, `${name}: `);
  message = replaceFirst(message, `${title}\nFailed `);
  message = replaceFirst(message, `${title}\n`);

  return message;
}

function parseFilePath(files) {
  files = files
    .filter((path) => {
      const paths = [
        'vendor/mockery/mockery',
        'vendor/phpunit/phpunit',
      ];

      return (new RegExp(paths.join('|'), 'ig')).test(path.replace(/\\/g, '/')) === false;
    })
    .map((path) => {
      const [, file, line] = path.match(/(.*):(\d+)/);

      return { filePath: file, lineNumber: line };
    });

  return files[files.length - 1];
}

export function parseTestcase(testcase) {
  const testcaseAttr = testcase.$;
  const duration = parseFloat(testcaseAttr.time || 0);
  const title = testcaseAttr.name || '';

  const error = testcase.failure || testcase.error;

  if (error === undefined) {
    return {
      duration,
      filePath: testcaseAttr.file,
      lineNumber: (testcaseAttr.line || 1) - 1,
      state: 'passed',
      title,
    };
  }

  const errorAttr = error[0].$;
  const errorChar = lf(error[0]._);
  const state = parseState(errorAttr);
  const files = parseFiles(errorChar);

  const file = parseFilePath(files) || {
    filePath: testcaseAttr.file,
    lineNumber: testcaseAttr.line - 1,
  };

  const name = lf(errorAttr.type);

  return {
    duration,
    error: { message: parseMessage(errorChar, files, name, title), name: '' },
    filePath: file.filePath,
    lineNumber: file.lineNumber - 1,
    state: state === 'skipped' ? state : 'failed',
    title,
  };
}

export function JunitParser(junitXML) {
  let testsuites;
  const messages = [];
  parseString(fs.readFileSync(junitXML), (error, json) => {
    testsuites = json.testsuites;
    for (const testsuite of testsuites.testsuite) {
      for (const testcase of testsuite.testcase || []) {
        messages.push(parseTestcase(testcase));
      }
    }
  });

  return messages;
}

export default function phpunitReporter(junitXML) {
  return JunitParser(junitXML);
}
