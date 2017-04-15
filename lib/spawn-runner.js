'use babel';

/* @flow */
import * as fs from 'fs';
import * as path from 'path';
import _ from 'lodash';
import { EOL, tmpdir } from 'os';
import { BufferedProcess } from 'atom';
import type { TextEditor } from 'atom';

import parse from './junit-parser';

function getCommand(projectPath, phpBinary, phpunitBinary) {
  if (phpBinary === '') {
    phpBinary = 'php';
  }

  if (phpunitBinary === '') {
    if (fs.existsSync(`${projectPath}/vendor/phpunit/phpunit/phpunit`) === true) {
      phpunitBinary = './vendor/phpunit/phpunit/phpunit';
    } else {
      phpunitBinary = 'phpunit';
    }
  }

  if (phpBinary === 'php' && phpunitBinary === 'phpunit') {
    return [phpunitBinary, ''];
  }

  return [phpBinary, phpunitBinary];
}

export function run(textEditor :TextEditor) {
  return new Promise((resolve) => {
    let processOutput = `\u001b[1mTester PHPUnit\u001b[0m${EOL}`;
    const filePath = textEditor.getPath();
    const projectPath = atom.project.relativizePath(filePath)[0];
    let cwd = projectPath;
    if (!(cwd)) {
      cwd = path.dirname(filePath);
    }
    const junitXML = `${tmpdir()}/junit-${(new Date().getTime())}.xml`;
    function parseReporterOutput(outputString) {
      const output = _.split(outputString, EOL).reduce((o, line) => o += line.toString() + EOL, '');
      const messages = [];
      try {
        parse(junitXML).forEach(message => messages.push(message));
      } catch (e) {
        console.error(e);
      } finally {
        fs.unlink(junitXML, (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
      if (!messages.length) {
        messages.push({
          state: 'unknown',
          title: 'No results',
          error: {
            name: '',
            message: output,
          },
          duration: 0,
          lineNumber: 0,
          filePath,
        });
      }
      return { messages, output };
    }
    const userConfigArgs = atom.config.get('tester-phpunit.args');
    const prohibitedArgs = ['--log-junit'];
    const removedArgs = _.remove(userConfigArgs, a => _.indexOf(prohibitedArgs, a) !== -1);
    if (removedArgs && removedArgs.length > 0) {
      atom.notifications.addWarning(`Tester: The args "${_.toString(removedArgs)}" are not allowed and removed from command.`);
    }

    const phpBinary = atom.config.get('tester-phpunit.phpBinaryPath');
    const phpunitBinary = atom.config.get('tester-phpunit.phpunitBinaryPath');
    const [command, firstArgument] = getCommand(projectPath, phpBinary, phpunitBinary);
    const args = _.union([firstArgument, filePath, `--log-junit=${junitXML}`], userConfigArgs);
    const options = { cwd };
    processOutput += `\u001b[1mcommand:\u001b[0m ${command} ${args.join(' ')}${EOL}`;
    processOutput += `\u001b[1mcwd:\u001b[0m ${cwd}${EOL}`;
    const stdout = data => processOutput += data;
    const stderr = data => processOutput += data;
    const exit = () => {
      this.bufferedProcess = null;
      resolve(parseReporterOutput(processOutput));
    };
    this.bufferedProcess = new BufferedProcess({ command, args, options, stdout, stderr, exit });
    this.bufferedProcess.onWillThrowError((errorObject) => {
      atom.notifications.addError('Tester is unable to locate the phpunit command. Please ensure process.env.PATH can access phpunit.');
      console.error('Tester PHPUnit: ', errorObject);
    });
  });
}

export function stop() {
  if (this.bufferedProcess) {
    this.bufferedProcess.kill();
    this.bufferedProcess = null;
  }
}
