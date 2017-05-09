'use babel';

/* @flow */
import { existsSync, readFile, unlink } from 'fs';
import { dirname } from 'path';
import { EOL, tmpdir } from 'os';
import { BufferedProcess } from 'atom';
import type { TextEditor } from 'atom';
import phpunitReporter from './phpunitReporter';

const readFileAsync = (filePath, encoding = 'utf8') => new Promise((resolve, reject) => {
  readFile(filePath, encoding, (err, data) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(data);
  });
});


const unlinkAsync = filePath => new Promise((resolve, reject) => {
  unlink(filePath, (err) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(true);
  });
});

function getCommand(projectPath, phpBinary, phpunitBinary) {
  if (phpBinary === '') {
    phpBinary = 'php';
  }

  if (phpunitBinary === '') {
    if (existsSync(`${projectPath}/vendor/phpunit/phpunit/phpunit`) === true) {
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

export function removeBadArgs(args :Array<string>) {
  if (!args) {
    return [];
  }

  const prohibitedArgs = ['--log-junit'];
  const clearArgs = [];
  args.forEach((arg) => {
    const index = prohibitedArgs.indexOf(arg);
    if (index === -1) {
      clearArgs.push(arg);
    }
  });
  return clearArgs;
}

export function parseReporterOutput(outputString :string, filePath :string, junitXML :string) {
  return new Promise((resolve) => {
    const output = outputString.split(EOL).reduce((o, line) => o += line.toString() + EOL, '');
    const messages = [];
    try {
      phpunitReporter(junitXML).forEach(message => messages.push(message));
    } catch (e) {
      console.error(e);
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
    resolve({ messages, output });
  });
}

export function run(textEditor :?TextEditor, additionalArgs: ?string) {
  return new Promise((resolve) => {
    let processOutput = `\u001b[1mTester PHPUnit\u001b[0m${EOL}`;
    const filePath = textEditor ? textEditor.getPath() : '';
    const projectPath = filePath ? atom.project.relativizePath(filePath)[0] : atom.project.getPaths()[0];

    let cwd = projectPath;
    if (!(cwd)) {
      cwd = dirname(filePath);
    }

    const junitXMLFilePath = `${tmpdir()}/junit-${(new Date().getTime())}.xml`;

    const phpBinary = atom.config.get('tester-phpunit.phpBinaryPath');
    const phpunitBinary = atom.config.get('tester-phpunit.phpunitBinaryPath');
    const [command, firstArgument] = getCommand(projectPath, phpBinary, phpunitBinary);

    const userConfigArgs = removeBadArgs(atom.config.get('tester-phpunit.args'));
    const additionalArgsArray = (additionalArgs && additionalArgs.trim()) ? removeBadArgs(additionalArgs.trim().split(' ')) : [];
    const defaultArgs = [firstArgument, filePath, `--log-junit=${junitXMLFilePath}`];
    if (filePath) {
      defaultArgs.push(filePath);
    }
    const args = defaultArgs.concat(userConfigArgs, additionalArgsArray);

    const options = { cwd };

    processOutput += `\u001b[1mcommand:\u001b[0m ${command} ${args.join(' ')}${EOL}`;
    processOutput += `\u001b[1mcwd:\u001b[0m ${cwd}${EOL}`;
    const stdout = data => processOutput += data;
    const stderr = data => processOutput += data;
    const exit = async () => {
      this.bufferedProcess = null;
      const results = await parseReporterOutput(processOutput, filePath, await readFileAsync(junitXMLFilePath, 'utf8'));
      await unlinkAsync(junitXMLFilePath);
      resolve(results);
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
