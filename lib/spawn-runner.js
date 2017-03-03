'use babel';

/* @flow */
import * as fs from 'fs';
import * as path from 'path';
import _ from 'lodash';
import os from 'os';
import { BufferedProcess } from 'atom';

export function run(textEditor) {
  console.log('run function call', textEditor);
  return new Promise((resolve) => {
    console.log('run promise create', textEditor);
    let processOutput = '';
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
      console.log('WRITE TEMP FILE', outputFilePath, textEditor.getText());
    }
    function parseReporterOutput(outputString) {
      let output = '';
      const messages = [];
      _.forEach(_.split(outputString, os.EOL), (line) => {
        console.log('HANDLE OUTPUT', line);
        try {
          const outputEvent = JSON.parse(line);
          messages.push(outputEvent);
        } catch (e) {
          console.log('ERROR JSON', e);
          output += line.toString() + os.EOL;
        }
      });
      return { messages, output };
    }
    const args = ['--reporter', `${atom.packages.resolvePackagePath('tester-mocha')}/lib/mocha-reporter.js`, '--colors', outputFilePath];
    const options = { cwd };
    const mochaBinary = atom.config.get('tester-mocha.binaryPath');
    const command = mochaBinary != null ? mochaBinary : `${atom.packages.resolvePackagePath('tester-mocha')}/node_modules/.bin/mocha`;
    const stdout = data => processOutput += data;
    const stderr = data => processOutput += data;
    const exit = (code) => {
      console.log('OUTPUT', processOutput, code);
      return resolve(parseReporterOutput(processOutput));
    };
    const process = new BufferedProcess({ command, args, options, stdout, stderr, exit });

    process.onWillThrowError((errorObject) => {
      atom.notifications.addError('Tester is unable to locate the mocha command. Please ensure process.env.PATH can access mocha.');
      console.error('Tester Mocha: ', errorObject);
    });
  });
}
