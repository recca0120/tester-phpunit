'use babel';

import { readFileSync } from 'fs';
import assert from 'assert';
import { JunitParser } from '../lib/phpunitReporter';

describe('junit parser test', async () => {
  const messages = await JunitParser(readFileSync(`${__dirname}/fixtures/junit.xml`));

  it('it should parse passed', () => {
    assert.deepEqual({
      duration: 0.006241,
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 12,
      state: 'passed',
      title: 'testPassed',
    }, messages[0]);
  });

  it('it should parse failed', () => {
    assert.deepEqual({
      duration: 0.001918,
      error: {
        message: 'asserting that false is true.',
        name: '',
        // name: 'PHPUnit_Framework_ExpectationFailedException',
      },
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 19,
      state: 'failed',
      title: 'testFailed',
    }, messages[1]);
  });

  it('it should parse error', () => {
    assert.deepEqual({
      duration: 0.001087,
      error: {
        message: 'Argument #1 (No Value) of PHPUnit_Framework_Assert::assertInstanceOf() must be a class or interface name',
        name: '',
        // name: 'PHPUnit_Framework_Exception',
      },
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 24,
      state: 'failed',
      title: 'testError',
    }, messages[2]);
  });

  it('it should parse skipped', () => {
    assert.deepEqual({
      duration: 0.001138,
      error: {
        message: 'Skipped Test',
        name: '',
        // name: 'PHPUnit_Framework_SkippedTestError',
      },
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 29,
      state: 'skipped',
      title: 'testSkipped',
    }, messages[3]);
  });

  it('it should parse incomplete', () => {
    assert.deepEqual({
      duration: 0.001081,
      error: {
        message: 'Incomplete Test',
        name: '',
        // name: 'PHPUnit_Framework_IncompleteTestError',
      },
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 34,
      state: 'failed',
      title: 'testIncomplete',
    }, messages[4]);
  });

  it('it should parse exception', () => {
    assert.deepEqual({
      duration: 0.164687,
      error: {
        message: 'Method Mockery_1_Symfony_Component_HttpFoundation_File_UploadedFile::getClientOriginalName() does not exist on this mock object',
        name: '',
        // name: 'BadMethodCallException',
      },
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 44,
      state: 'failed',
      title: 'testReceive',
    }, messages[5]);
  });

  it('it should get current error message when mockery call not correct.', () => {
    assert.deepEqual({
      duration: 0.008761,
      error: {
        message: 'Method delete("C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php") ' +
          'from Mockery_1_Recca0120_Upload_Filesystem should be called\n exactly 1 times but called 0 times.',
        name: '',
        // name: 'Mockery\\Exception\\InvalidCountException',
      },
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 12,
      state: 'failed',
      title: 'testCleanDirectory',
    }, messages[6]);
  });
});
