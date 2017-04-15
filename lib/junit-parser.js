'use babel';

import * as fs from 'fs';
import _ from 'lodash';
import { parseString } from 'xml2js';

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
  return _(errorChar.split('\n'))
    .map(line => line.trim())
    .filter(line => /(.*):(\d+)/.test(line))
    .value();
}

function parseMessage(message, files, messageName) {
  files.forEach(line => message = message.replace(line, ''));
  message = message.replace(/\n+$/, '');

  const index = message.indexOf(messageName);
  if (index === -1) {
    return message;
  }

  messageName = `${messageName}: `;

  return message.substr(index + messageName.length);
}

function parseFilePath(files) {
  return _(files)
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
    })
    .last();
}

export function parseTestcase(testcase) {
  const testcaseAttr = testcase.$;
  const duration = _.get(testcaseAttr, 'time');
  const title = _.get(testcaseAttr, 'name');

  const error = _.get(testcase, 'failure') || _.get(testcase, 'error');

  if (error === undefined) {
    return {
      title,
      duration,
      filePath: _.get(testcaseAttr, 'file'),
      lineNumber: _.get(testcaseAttr, 'line') - 1,
      state: 'passed',
    };
  }

  const errorAttr = _.get(error, '0.$');
  const errorChar = _.get(error, '0._').replace(/\r\n/g, '\n');
  const state = parseState(errorAttr);
  const files = parseFiles(errorChar);

  const file = parseFilePath(files) || {
    filePath: _.get(testcaseAttr, 'file'),
    lineNumber: _.get(testcaseAttr, 'line') - 1,
  };

  return {
    duration,
    filePath: file.filePath,
    lineNumber: file.lineNumber - 1,
    state: state === 'skipped' ? state : 'failed',
    title,
    error: {
      message: parseMessage(errorChar, files, errorAttr.type, title),
      name: errorAttr.type,
    },
  };
}

export default function parse(filename) {
  let testsuites;
  const messages = [];
  parseString(fs.readFileSync(filename), (error, json) => {
    testsuites = json.testsuites;
    _.forEach(testsuites.testsuite, (testsuite) => {
      // const testsuiteAttrs = testsuite.$;
      _.forEach(_.get(testsuite, 'testcase', []), (testcase) => {
        messages.push(parseTestcase(testcase));
      });
    });
  });

  return messages;
}
