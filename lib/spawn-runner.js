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

export function run(textEditor/* :TextEditor*/) {
  return new Promise((resolve) => {
    let processOutput = `\u001b[1mTester Mocha\u001b[0m${os.EOL}`;
    const fileName = textEditor.getPath();
    let outputFilePath = fileName;
    const projectPath = atom.project.relativizePath(fileName)[0];
    let cwd = projectPath;
    if (!(cwd)) {
      cwd = path.dirname(fileName);
    }
    const fileModified = textEditor.isModified();
    if (fileModified) {
      const outputDir = `${atom.getConfigDirPath()}/tester-mocha`;
      if (!fs.existsSync(outputDir)) {
        fs.mkdir(outputDir);
      }
      outputFilePath = `${outputDir}/${path.basename(fileName)}`;
      fs.writeFileSync(outputFilePath, textEditor.getText());
    }
    function parseReporterOutput(outputString) {
      let output = '';
      const messages = [];
      _.forEach(_.split(outputString, os.EOL), (line) => {
        try {
          const outputEvent = JSON.parse(line);
          messages.push(outputEvent);
        } catch (e) {
          output += line.toString() + os.EOL;
        }
      });
      return { messages, output };
    }
    const args = _.union(['--reporter', `${atom.packages.resolvePackagePath('tester-mocha')}/lib/mocha-reporter.js`, outputFilePath], atom.config.get('tester-mocha.args'));
    const options = { cwd };
    const mochaBinary = atom.config.get('tester-mocha.binaryPath');
    const command = mochaBinary !== '' ? mochaBinary : `${atom.packages.resolvePackagePath('tester-mocha')}/node_modules/.bin/mocha`;
    processOutput += `\u001b[1mcommand:\u001b[0m ${command} ${args.join(' ')}${os.EOL}`;
    processOutput += `\u001b[1mcwd:\u001b[0m ${cwd}${os.EOL}`;
    const stdout = data => processOutput += data;
    const stderr = data => processOutput += data;
    const exit = () => resolve(parseReporterOutput(processOutput));
    const process = new BufferedProcess({ command, args, options, stdout, stderr, exit });

    process.onWillThrowError((errorObject) => {
      atom.notifications.addError('Tester is unable to locate the mocha command. Please ensure process.env.PATH can access mocha.');
      console.error('Tester Mocha: ', errorObject);
    });
  });
}
