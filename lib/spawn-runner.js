'use babel';

/* @flow */
import * as fs from 'fs';
import * as path from 'path';
import { BufferedProcess } from 'atom';

export function run(textEditor) {
  console.log('run function call', textEditor);
  return new Promise((resolve) => {
    console.log('run promise create', textEditor);
    let output = '';
    const messages = [];
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
    function handleReporterOutput(outputString) {
      try {
        const outputEvent = JSON.parse(outputString);
        messages.push(outputEvent);
      } catch (e) {
        output += outputString.toString();
      }
    }
    const args = ['--reporter', `${atom.packages.resolvePackagePath('tester-mocha')}/lib/mocha-reporter.js`, '--colors', outputFilePath];
    const options = { cwd };
    const mochaBinary = atom.config.get('tester-mocha.binaryPath');
    const command = mochaBinary != null ? mochaBinary : `${atom.packages.resolvePackagePath('tester-mocha')}/node_modules/.bin/mocha`;
    const stdout = handleReporterOutput;
    const stderr = handleReporterOutput;
    const exit = (code) => {
      console.log('OUTPUT', output, code);
      return resolve({ messages, output });
    };
    const process = new BufferedProcess({ command, args, options, stdout, stderr, exit });

    process.onWillThrowError((errorObject) => {
      atom.notifications.addError('Tester is unable to locate the mocha command. Please ensure process.env.PATH can access mocha.');
      console.error('Tester Mocha: ', errorObject);
    });
  });
}
