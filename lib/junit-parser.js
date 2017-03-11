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
  const files = _(errChar.split('\n'))
    .filter((line) => {
      line = line.trim();
      return /(.*):(\d+)/.test(line);
    })
    .value();

  messageError.message = errChar;
  files.forEach((line) => {
    messageError.message = messageError.message.replace(line, '');
  });
  messageError.message = messageError.message.replace(/\n+$/, '\n');

  console.log(files);
  // const pos = errChar.lastIndexOf('[:enter]');
  // if (pos !== -1) {
  //   messageError.message = errChar.substr(0, pos + 8).replace(/\[:enter\]/g, '');
  //   const files = _(errChar.substr(pos + 8, errChar.length - (pos + 8)).split('\n'))
  //     .filter((path) => {
  //       if (path.trim() === '') {
  //         return false;
  //       }
  //       const paths = [
  //         'vendor/mockery/mockery',
  //         'vendor/phpunit/phpunit',
  //       ];
  //
  //       return (new RegExp(paths.join('|'), 'ig')).test(path.replace(/\\/g, '/')) === false;
  //     })
  //     .map((path) => {
  //       try {
  //         const [, file, line] = path.match(/(.*):(\d+)/);
  //
  //         return {
  //           filePath: file,
  //           lineNumber: line,
  //         };
  //       } catch (e) {
  //         console.error(e);
  //       }
  //
  //       return null;
  //     })
  //     .value();
  //
  //   const file = _.get(files, files.length - 1, {
  //     filePath,
  //     lineNumber,
  //   });
  //
  //   console.log(file);
  //
  //   filePath = file.filePath;
  //   lineNumber = file.lineNumber - 1;
  //   state = state === 'skipped' ? state : 'failed';
  // }

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
