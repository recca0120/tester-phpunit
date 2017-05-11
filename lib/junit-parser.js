'use babel';

import { xml2json, crlf2lf, replaceFirst, getClassName } from './helpers';

function parseState(errAttr :Object) :string {
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

function parseFiles(errorChar :string) :Array<string> {
  return errorChar.split('\n')
    .map(line => line.trim())
    .filter(line => /(.*):(\d+)/.test(line));
}

function parseMessage(message :string, files :Array<string>, name :string, title :string) :string {
  message = crlf2lf(message);
  files.forEach(line => message = message.replace(line, ''));
  message = message.replace(/\n+$/, '');
  message = replaceFirst(message, `${name}: `);
  message = replaceFirst(message, `${title}\n`);

  return message;
}

function parseFilePath(files :Array<string>) :string {
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

function getError(testcase) {
  if (testcase.failure) {
    return testcase.failure;
  }

  if (testcase.error) {
    return testcase.error;
  }

  if (testcase.skipped) {
    return [{
      $: {
        type: 'skipped',
      },
      _: '',
    }];
  }

  return null;
}

export function parseTestcase(testcase :Object) :Object {
  const testcaseAttr = testcase.$;
  const duration = parseFloat(testcaseAttr.time || 0);
  const title = testcaseAttr.name || '';
  const error = getError(testcase);

  if (error === null) {
    return {
      duration,
      filePath: testcaseAttr.file,
      lineNumber: (testcaseAttr.line || 1) - 1,
      state: 'passed',
      title,
    };
  }

  const errorAttr = error[0].$;
  const errorChar = crlf2lf(error[0]._);
  const state = parseState(errorAttr);
  const files = parseFiles(errorChar);

  const file = parseFilePath(files) || {
    filePath: testcaseAttr.file,
    lineNumber: testcaseAttr.line,
  };

  const name = crlf2lf(errorAttr.type);

  return {
    duration,
    error: { message: parseMessage(errorChar, files, name, title), name: '' },
    filePath: file.filePath,
    lineNumber: file.lineNumber - 1,
    state: state === 'skipped' ? state : 'failed',
    title,
  };
}

export function parseTestsuite(testsuite :Object) :Array<Object> {
  let messages = [];
  if (testsuite.testsuite) {
    for (testsuite of testsuite.testsuite) {
      messages = messages.concat(parseTestsuite(testsuite));
    }
  } else if (testsuite.testcase) {
    for (const testcase of testsuite.testcase) {
      messages.push(parseTestcase(testcase));
    }
  }

  return messages;
}

export async function stringToMessages(xml :string) :Array<Object> {
  const json = await xml2json(xml);

  return parseTestsuite(json.testsuites);
}

export function generateString(filePath :string) :string {
  const className = getClassName(filePath);

  return `<?xml version="1.0" encoding="UTF-8"?>
  <testsuites>
    <testsuite name="${className}" file="${filePath}" tests="0" assertions="0" failures="0" errors="0" time="0">
      <testcase name="" class="${className}" file="${filePath}" line="0" assertions="0" time="0">
        <error type="PHPUnit_Framework_SkippedTestError">
          ${filePath}:0
        </error>
      </testcase>
    </testsuite>
  </testsuites>`;
}
