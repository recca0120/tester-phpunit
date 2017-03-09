'use babel';

import { parseString } from 'xml2js';
import * as fs from 'fs';
import _ from 'lodash';

export default class PHPUnitReporter {
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
    let errorMessage;
    if (testcase.failure) {
      errorMessage = _.get(testcase, 'failure.0._');
    }

    if (testcase.error) {
      errorMessage = _.get(testcase, 'error.0._');
    }

    if (!errorMessage) {
      return {};
    }

    const [name, message, file] = errorMessage.replace(/(\r|\n)+/g, '\n').split('\n');
    const [, filename, line] = file.match(/(.*):(\d+)/);

    return {
      filePath: filename,
      lineNumber: line - 1,
      state: 'failed',
      error: {
        name,
        message,
      },
    };
  }
}
