'use babel';

import assert from 'assert';
import parser from '../lib/junit-parser';

describe('JUnitParser', () => {
  const messages = parser(`${__dirname}/junit.xml`);

  describe('parse', () => {
    it('should have passed', () => {
      assert.deepEqual({
        duration: '0.006241',
        filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
        lineNumber: 12,
        state: 'passed',
        title: 'testPassed',
        error: {},
      }, messages[0]);
    });

    it('should have failed', () => {
      assert.deepEqual({
        duration: '0.001918',
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
        duration: '0.001087',
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

    it('should have skipped', () => {
      assert.deepEqual({
        duration: '0.001138',
        filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
        lineNumber: 29,
        state: 'skipped',
        title: 'testSkipped',
        error: {
          message: 'Skipped Test',
          name: 'Skipped Test',
        },
      }, messages[3]);
    });

    it('should have incomplete', () => {
      assert.deepEqual({
        duration: '0.001081',
        filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
        lineNumber: 34,
        state: 'failed',
        title: 'testIncomplete',
        error: {
          message: 'Incomplete Test',
          name: 'Incomplete Test',
        },
      }, messages[4]);
    });
  });
});
