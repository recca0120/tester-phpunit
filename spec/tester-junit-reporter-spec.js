'use babel';

import { readFileSync } from 'fs';
import { stringToMessages } from '../lib/junit-parser';

describe('junit-parser', async () => {
  async function getMessages() {
    const messages = await stringToMessages(readFileSync(`${__dirname}/fixtures/junit.xml`).toString());

    return messages;
  }

  it('it should parse passed', async () => {
    const messages = await getMessages();

    expect(messages[0]).toEqual({
      duration: 0.006241,
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 12,
      state: 'passed',
      title: 'testPassed',
    });
  });

  it('it should parse failed', async () => {
    const messages = await getMessages();

    expect(messages[1]).toEqual({
      duration: 0.001918,
      error: {
        message: 'Failed asserting that false is true.',
        name: '',
        // name: 'PHPUnit_Framework_ExpectationFailedException',
      },
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 19,
      state: 'failed',
      title: 'testFailed',
    });
  });

  it('it should parse error', async () => {
    const messages = await getMessages();

    expect(messages[2]).toEqual({
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
    });
  });

  it('it should parse skipped', async () => {
    const messages = await getMessages();

    expect(messages[3]).toEqual({
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
    });
  });

  it('it should parse incomplete', async () => {
    const messages = await getMessages();

    expect(messages[4]).toEqual({
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
    });
  });

  it('it should parse exception', async () => {
    const messages = await getMessages();

    expect(messages[5]).toEqual({
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
    });
  });

  it('it should get current error message when mockery call not correct.', async () => {
    const messages = await getMessages();

    expect(messages[6]).toEqual({
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
    });
  });

  it('it should be skipped when testcase has skipped tag', async () => {
    const messages = await getMessages();

    expect(messages[7]).toEqual({
      duration: 0.001352,
      error: {
        message: '',
        name: '',
      },
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 22,
      state: 'skipped',
      title: 'testSkipped',
    });

    expect(messages[8]).toEqual({
      duration: 0.000954,
      error: {
        message: '',
        name: '',
      },
      filePath: 'C:\\Users\\recca\\github\\tester-phpunit\\tests\\PHPUnitTest.php',
      lineNumber: 27,
      state: 'skipped',
      title: 'testIncomplete',
    });
  });
});
