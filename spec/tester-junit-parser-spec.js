'use babel';

import assert from 'assert';
import parser from '../lib/junit-parser';

/* @flow */
describe('junit parser test', () => {
  const messages = parser(`${__dirname}/fixtures/junit.xml`);

  it('it should parse passed', () => {
    assert.deepEqual({
      duration: '0.006241',
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 12,
      state: 'passed',
      title: 'testPassed',
    }, messages[0]);
  });

  it('it should parse failed', () => {
    assert.deepEqual({
      duration: '0.001918',
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 19,
      state: 'failed',
      title: 'testFailed',
      error: {
        message: 'Failed asserting that false is true.',
        name: 'PHPUnit_Framework_ExpectationFailedException',
      },
    }, messages[1]);
  });

  it('it should parse error', () => {
    assert.deepEqual({
      duration: '0.001087',
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 24,
      state: 'failed',
      title: 'testError',
      error: {
        message: 'PHPUnit_Framework_Exception: Argument #1 (No Value) of PHPUnit_Framework_Assert::assertInstanceOf() must be a class or interface name',
        name: 'PHPUnit_Framework_Exception',
      },
    }, messages[2]);
  });

  it('it should parse skipped', () => {
    assert.deepEqual({
      duration: '0.001138',
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 29,
      state: 'skipped',
      title: 'testSkipped',
      error: {
        message: 'Skipped Test',
        name: 'PHPUnit_Framework_SkippedTestError',
      },
    }, messages[3]);
  });

  it('it should parse incomplete', () => {
    assert.deepEqual({
      duration: '0.001081',
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 34,
      state: 'failed',
      title: 'testIncomplete',
      error: {
        message: 'Incomplete Test',
        name: 'PHPUnit_Framework_IncompleteTestError',
      },
    }, messages[4]);
  });

  it('it should parse  exception', () => {
    assert.deepEqual({
      duration: '0.164687',
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 44,
      state: 'failed',
      title: 'testReceive',
      error: {
        message: 'BadMethodCallException: Method Mockery_1_Symfony_Component_HttpFoundation_File_UploadedFile::getClientOriginalName() does not exist on this mock object',
        name: 'BadMethodCallException',
      },
    }, messages[5]);
  });
});
