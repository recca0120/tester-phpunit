'use babel';

import { parseString } from 'xml2js';
import * as fs from 'fs';
import _ from 'lodash';

export default class JUnitParser {
  constructor() {
    Object.assign(this, {
      messages: [],
    });
  }

  parse(filename) {
    parseString(fs.readFileSync(filename), (err, xml) => {
      _.get(xml, 'testsuites.testsuite', []).forEach(
        this.parseTestsuite.bind(this),
      );
    });

    return this.messages;
  }

  parseTestsuite(testsuite) {
    testsuite.testcase.forEach(
        this.parseTestcase.bind(this),
      );
  }

  parseTestcase(testcase) {
    this.messages.push(
      Object.assign({
        filePath: _.get(testcase, '$.file'),
        lineNumber: _.get(testcase, '$.line') - 1,
        duration: _.get(testcase, '$.time'),
        title: _.get(testcase, '$.name'),
        state: 'passed',
      }, this.parseErrorMessage(testcase)),
    );
  }

  parseErrorMessage(testcase) {
    if (!testcase.failure && !testcase.error) {
      return {};
    }

    const messageObject = _.get(testcase.failure || testcase.error, '0');
    const type = _.get(messageObject, '$.type', '').toLowerCase();

    let state = 'error';
    if (type.indexOf('skipped') !== -1) {
      state = 'skipped';
    } else if (type.indexOf('incomplete') !== -1) {
      state = 'incomplete';
    } else if (type.indexOf('failed') !== -1) {
      state = 'failed';
    }

    state = type.indexOf('skipped') !== -1 ? 'skipped' : state;
    const errorMessages = _.get(messageObject, '_').replace(/(\r|\n)+/g, '\n').split('\n');

    const name = errorMessages[0];
    let message = '';
    let file = '';
    if (['error', 'failed'].includes(state)) {
      message = errorMessages[1];
      file = errorMessages[2];
    } else {
      message = name;
      file = errorMessages[1];
    }
    const [, filename, line] = file.match(/(.*):(\d+)/);

    return {
      filePath: filename,
      lineNumber: line - 1,
      state: state !== 'skipped' ? 'failed' : state,
      error: {
        name,
        message,
      },
    };
  }
}
