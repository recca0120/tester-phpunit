'use babel';

import * as fs from 'fs';
import _ from 'lodash';
import { parseString } from 'xml2js';

export function parseTestcaseError(testcase) {
  const err = _.get(testcase, 'failure') || _.get(testcase, 'error');
  const testcaseAttr = testcase.$;
  let state = 'passed';
  let filePath = _.get(testcaseAttr, 'file');
  let lineNumber = _.get(testcaseAttr, 'line') - 1;

  if (!err) {
    return {
      filePath,
      lineNumber,
      state,
    };
  }

  const messageError = {};
  const errAttr = _.get(err, '0.$');
  const errChar = _.get(err, '0._').replace(/\r\n/g, '\n');

  const type = errAttr.type.toLowerCase();
  if (type.indexOf('skipped') !== -1) {
    state = 'skipped';
  } else if (type.indexOf('incomplete') !== -1) {
    state = 'incomplete';
  } else if (type.indexOf('failed') !== -1) {
    state = 'failed';
  } else {
    state = 'error';
  }

  messageError.name = errAttr.type;
  let files = _(errChar.split('\n'))
    .map(line => line.trim())
    .filter(line => /(.*):(\d+)/.test(line))
    .value();

  messageError.message = errChar;
  files.forEach((line) => {
    messageError.message = messageError.message.replace(line, '');
  });
  messageError.message = messageError.message.replace(/\n+$/, '');

  files = _(files)
    .filter((path) => {
      const paths = [
        'vendor/mockery/mockery',
        'vendor/phpunit/phpunit',
      ];

      return (new RegExp(paths.join('|'), 'ig')).test(path.replace(/\\/g, '/')) === false;
    })
    .map((path) => {
      const [, file, line] = path.match(/(.*):(\d+)/);

      return {
        filePath: file,
        lineNumber: line,
      };
    })
    .value();

  const file = _.get(files, files.length - 1, {
    filePath,
    lineNumber,
  });

  filePath = file.filePath;
  lineNumber = file.lineNumber - 1;
  state = state === 'skipped' ? state : 'failed';

  return {
    filePath,
    lineNumber,
    error: messageError,
    state,
  };
}

export function parseTestcase(testcase) {
  const testcaseAttr = testcase.$;

  return Object.assign({
    duration: _.get(testcaseAttr, 'time'),
    title: _.get(testcaseAttr, 'name'),
  }, parseTestcaseError(testcase));
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
