'use babel';

/* @flow */
import { existsSync, readFile, writeFileSync, unlink } from 'fs';
import { dirname } from 'path';
import { EOL, tmpdir } from 'os';
import { BufferedProcess } from 'atom';
import type { TextEditor } from 'atom';
import { stringToMessages, generateString } from './junit-parser';

function readFileAsync(filePath :string, encoding = 'utf8') :Promise<string> {
  return new Promise((resolve, reject) => {
    readFile(filePath, encoding, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });
}

function unlinkAsync(filePath :string) :Promise<boolean> {
  return new Promise((resolve) => {
    if (existsSync(filePath)) {
      resolve(false);
    }

    unlink(filePath, (err) => {
      if (err) {
        resolve(false);
        return;
      }

      resolve(true);
    });
  });
}

export function getCommand(projectPath :string, phpBinary :string, phpunitBinary :string) :Array<string> {
  phpBinary = phpBinary || 'php';
  phpunitBinary = phpunitBinary || 'phpunit';

  if (phpunitBinary === 'phpunit' && existsSync(`${projectPath}/vendor/phpunit/phpunit/phpunit`) === true) {
    phpunitBinary = `${projectPath}/vendor/phpunit/phpunit/phpunit`;
  }

  if (phpunitBinary === 'phpunit') {
    return [phpunitBinary, ''];
  }

  return [phpBinary, phpunitBinary];
}

export function getConfigurationFile(projectPath :string, configurationFilePath :string) :string {
  if (existsSync(`${projectPath}/phpunit.xml`) === true) {
    return `${projectPath}/phpunit.xml`;
  }

  if (existsSync(`${projectPath}/phpunit.xml.dist`) === true) {
    return `${projectPath}/phpunit.xml.dist`;
  }

  const configurationString = `<?xml version="1.0" encoding="UTF-8"?>
<phpunit backupGlobals="false"
         backupStaticAttributes="false"
         colors="true"
         convertErrorsToExceptions="true"
         convertNoticesToExceptions="true"
         convertWarningsToExceptions="true"
         processIsolation="false"
         stopOnFailure="false">
  <testsuites>
    <testsuite name="Unit Tests">
      <directory suffix="Test.php">${projectPath}/test</directory>
      <directory suffix="Test.php">${projectPath}/tests</directory>
      <directory suffix="Test.php">${projectPath}/Test</directory>
      <directory suffix="Test.php">${projectPath}/Tests</directory>
    </testsuite>
  </testsuites>
</phpunit>`;
  writeFileSync(configurationFilePath, configurationString, 'utf8');

  return configurationFilePath;
}

export function removeBadArgs(args :Array<string>) :Array<string> {
  if (!args) {
    return [];
  }

  const prohibitedArgs = ['--log-junit', '--colors'];
  const clearArgs = [];
  args.forEach((arg) => {
    const equalPosition = arg.indexOf('=');
    if (equalPosition !== -1) {
      arg = arg.substr(0, equalPosition);
    }
    const index = prohibitedArgs.indexOf(arg);
    if (index === -1) {
      clearArgs.push(arg);
    }
  });
  return clearArgs;
}

export function phpParseError(output :string) :string {
  if (/Parse error/.test(output) === true) {
    return output.split('\n').slice(4).join('\n');
  }

  return '';
}

export async function parseReporterOutput(
  outputString :string,
  filePath :string,
  extraString :string,
) :Promise<{messages :Array<Object>, output :string}> {
  const output = outputString.toString();
  let messages = [];
  try {
    messages = await stringToMessages(extraString);
  } catch (error) {
    atom.notifications.addError('Tester Phpunit: Could not parse data to JSON.');
  }

  const parseError = phpParseError(output);
  if (parseError !== '') {
    atom.notifications.addError(parseError);
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

export function run(textEditor :?TextEditor, additionalArgs: ?string) {
  return new Promise((resolve) => {
    let processOutput = `\u001b[1mTester PHPUnit\u001b[0m${EOL}`;
    const filePath = textEditor ? textEditor.getPath() : '';
    const projectPath = filePath ? atom.project.relativizePath(filePath)[0] : atom.project.getPaths()[0];

    let cwd = projectPath;
    if (!(cwd)) {
      cwd = dirname(filePath);
    }

    const extraFilePath = `${tmpdir()}/junit-${(new Date().getTime())}.xml`;
    const configurationFilePath = `${tmpdir()}/phpunit-${(new Date().getTime())}.xml`;

    const [command, firstArgument] = getCommand(
      projectPath,
      atom.config.get('tester-phpunit.phpBinaryPath'),
      atom.config.get('tester-phpunit.phpunitBinaryPath'),
    );

    const userConfigArgs = removeBadArgs(atom.config.get('tester-phpunit.args'));
    const additionalArgsArray = (additionalArgs && additionalArgs.trim()) ? removeBadArgs(additionalArgs.trim().split(' ')) : [];
    const defaultArgs = [
      firstArgument,
      `--log-junit=${extraFilePath}`,
      `--configuration=${getConfigurationFile(projectPath, configurationFilePath)}`,
      '--colors=always',
    ];
    if (filePath) {
      defaultArgs.push(filePath);
    }

    const args = defaultArgs.concat(userConfigArgs, additionalArgsArray).filter(arg => arg !== '');

    const options = { cwd };

    processOutput += `\u001b[1mcommand:\u001b[0m ${command} ${args.join(' ')}${EOL}`;
    processOutput += `\u001b[1mcwd:\u001b[0m ${cwd}${EOL}`;
    const stdout = data => processOutput += data;
    const stderr = data => processOutput += data;
    const exit = async () => {
      this.bufferedProcess = null;

      const results = await parseReporterOutput(
        processOutput,
        filePath,
        existsSync(extraFilePath) === true
          ? await readFileAsync(extraFilePath, 'utf8')
          : generateString(filePath),
        );

      await unlinkAsync(configurationFilePath);
      await unlinkAsync(extraFilePath);

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
