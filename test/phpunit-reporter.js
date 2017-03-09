'use babel';

import assert from 'assert';
import PHPUnitReporter from '../lib/phpunit-reporter';

describe('PHPUnitReporter', () => {
  const phpunitReporter = new PHPUnitReporter();
  const messages = phpunitReporter.parse(`${__dirname}/junit.xml`);

  describe('parse', () => {
    it('should have passed', () => {
      assert.deepEqual({
        duration: '0.008168',
        filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
        lineNumber: 12,
        state: 'passed',
        title: 'testPassed',
      }, messages[0]);
    });

    it('should have failed', () => {
      assert.deepEqual({
        duration: '0.001182',
        filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
        lineNumber: 19,
        state: 'failed',
        title: 'testFailed',
        error: {
          message: 'Failed asserting that false is true.',
          name: 'PHPUnitTest::testFailed',
        },
      }, messages[1]);
    });

    it('should have error', () => {
      assert.deepEqual({
        duration: '0.000785',
        filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
        lineNumber: 24,
        state: 'failed',
        title: 'testError',
        error: {
          message: 'PHPUnit_Framework_Exception: Argument #1 (No Value) of PHPUnit_Framework_Assert::assertInstanceOf() must be a class or interface name',
          name: 'PHPUnitTest::testError',
        },
      }, messages[2]);
    });
  });
});
