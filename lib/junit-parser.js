'use babel';

import * as fs from 'fs';
import xml2json from 'xml2json';

export default function parse(filename) {
  const json = JSON.parse(xml2json.toJson(fs.readFileSync(filename)));
  const testsuites = json.testsuites;
  const messages = [];
  Object.values(testsuites).forEach((testsuite) => {
    testsuite.testcase.forEach((testcase) => {
      let state = 'passed';
      let filePath = testcase.file;
      let lineNumber = testcase.line;
      const messageError = {};
      const error = testcase.failure || testcase.error;
      if (error) {
        const type = error.type.toLowerCase();
        if (type.indexOf('skipped') !== -1) {
          state = 'skipped';
        } else if (type.indexOf('incomplete') !== -1) {
          state = 'incomplete';
        } else if (type.indexOf('failed') !== -1) {
          state = 'failed';
        } else {
          state = 'error';
        }
        const msgs = error.$t.replace(/(\r|\n)+/g, '\n').split('\n');
        let file;
        messageError.name = msgs[0];
        if (msgs.length === 2) {
          file = msgs[1];
          messageError.message = msgs[0];
        } else {
          file = msgs[msgs.length - 1];
          messageError.message = msgs[1];
        }
        const matches = file.match(/(.*):(\d+)/);
        filePath = matches[1];
        lineNumber = matches[2];
        state = state === 'skipped' ? state : 'failed';
      }

      messages.push({
        filePath,
        lineNumber: lineNumber - 1,
        duration: testcase.time,
        title: testcase.name,
        state,
        error: messageError,
      });
    });
  });

  return messages;
}
