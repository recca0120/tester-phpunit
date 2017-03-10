'use babel';

/* @flow */
import * as fs from 'fs';
import * as path from 'path';
import _ from 'lodash';
import os from 'os';
import { BufferedProcess } from 'atom';
/* flow-include
import type { TextEditor } from 'atom'
*/
import parse from './junit-parser';

export function run(textEditor/* :TextEditor*/) {
  return new Promise((resolve) => {
    const junitXML = `${__dirname}/../temp/junit-${(new Date().getTime())}.xml`;
    let processOutput = `\u001b[1mTester PHPUnit\u001b[0m${os.EOL}`;
    const fileName = textEditor.getPath();
    let outputFilePath = fileName;
    const projectPath = atom.project.relativizePath(fileName)[0];
    let cwd = projectPath;
    if (!(cwd)) {
      cwd = path.dirname(fileName);
    }
    const fileModified = textEditor.isModified();
    if (fileModified) {
      outputFilePath = `${path.dirname(fileName)}/.${path.basename(fileName)}`;
      fs.writeFileSync(outputFilePath, textEditor.getText());
    }
    function parseReporterOutput(outputString) {
      const output = _.split(outputString, os.EOL).reduce((o, line) => o += line.toString() + os.EOL, '');
      let messages = [];
      try {
        messages = parse(junitXML);
      } catch (e) {
        console.error(e);
      } finally {
        fs.unlink(junitXML, (err) => {
          if (err) {
            console.error(err);
          }
        });
      }

      return { messages, output };
    }
    const args = _.union([outputFilePath, `--log-junit=${junitXML}`], atom.config.get('tester-phpunit.args'));
    const options = { cwd };
    const phpunitBinary = atom.config.get('tester-phpunit.binaryPath');
    /*
    const command = phpunitBinary !== ''
      ? phpunitBinary
      : `${atom.packages.resolvePackagePath('tester-phpunit')}/node_modules/.bin/phpunit`;
    */
    const command = phpunitBinary !== '' ? phpunitBinary : 'phpunit';
    processOutput += `\u001b[1mcommand:\u001b[0m ${command} ${args.join(' ')}${os.EOL}`;
    processOutput += `\u001b[1mcwd:\u001b[0m ${cwd}${os.EOL}`;
    const stdout = data => processOutput += data;
    const stderr = data => processOutput += data;
    const exit = () => {
      if (fileModified) {
        fs.unlink(outputFilePath);
      }
      resolve(parseReporterOutput(processOutput));
    };
    const process = new BufferedProcess({ command, args, options, stdout, stderr, exit });

    process.onWillThrowError((errorObject) => {
      atom.notifications.addError('Tester is unable to locate the phpunit command. Please ensure process.env.PATH can access phpunit.');
      console.error('Tester PHPUnit: ', errorObject);
    });
  });
}
