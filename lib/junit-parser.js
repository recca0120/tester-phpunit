'use babel';

import * as fs from 'fs';
import _ from 'lodash';
import { parseString } from 'xml2js';


function splitLine(line) {
  return line.replace(/\r\n/, '\n').split('\n');
}

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
  const errChar = _.get(err, '0._');

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

  const msgs = _(splitLine(errChar))
    .map(line => line.trim())
    .filter().value();
  messageError.name = errAttr.type;
  messageError.message = msgs.length === 2 ? msgs[0] : msgs[1];

  const files = _(splitLine(msgs[msgs.length - 1])).map((line) => {
    try {
      const matches = line.match(/(.*):(\d+)/);

      return {
        filePath: matches[1],
        lineNumber: matches[2],
      };
    } catch (e) {
      console.error(e);
    }

    return null;
  }).filter().value();

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
