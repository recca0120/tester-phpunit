'use babel';

import * as fs from 'fs';
import _ from 'lodash';
import { parseString } from 'xml2js';

export default function parse(filename) {
  let testsuites;
  const messages = [];
  parseString(fs.readFileSync(filename), (error, json) => {
    testsuites = json.testsuites;
    _.forEach(testsuites.testsuite, (testsuite) => {
      // const testsuiteAttrs = testsuite.$;
      _.forEach(_.get(testsuite, 'testcase', []), (testcase) => {
        const testcaseAttr = testcase.$;
        let state = 'passed';
        let filePath = _.get(testcaseAttr, 'file');
        let lineNumber = _.get(testcaseAttr, 'line');

        const messageError = {};
        const err = _.get(testcase, 'failure') || _.get(testcase, 'error');
        if (err) {
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
          const msgs = _.filter(errChar.replace(/(\r|\n)+/g, '\n').split('\n'));
          messageError.name = msgs[0];
          messageError.message = msgs.length > 2 ? msgs[1] : msgs[0];
          const matches = msgs[msgs.length - 1].match(/(.*):(\d+)/);
          filePath = matches[1];
          lineNumber = matches[2];
          state = state === 'skipped' ? state : 'failed';
        }
        messages.push({
          filePath,
          lineNumber: lineNumber - 1,
          duration: _.get(testcaseAttr, 'time'),
          title: _.get(testcaseAttr, 'name'),
          state,
          error: messageError,
        });
      });
    });
  });

  return messages;
}
