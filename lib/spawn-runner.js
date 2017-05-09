'use babel';

/* @flow */
import { existsSync, readFile, writeFileSync, unlink } from 'fs';
import { dirname, basename } from 'path';
import { EOL, tmpdir } from 'os';
import { BufferedProcess } from 'atom';
import type { TextEditor } from 'atom';
import { JunitParser } from './phpunitReporter';

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

export function generateEmptyJUnitXML(filePath) {
  const className = basename(filePath).replace(/\.php$/i, '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
    <testsuite name="${className}" file="${filePath}" tests="0" assertions="0" failures="0" errors="0" time="0">
        <testcase name="" class="${className}" file="${filePath}" line="0" assertions="0" time="0">
          <error type="PHPUnit_Framework_SkippedTestError">
    ${filePath}:0
    </error>
        </testcase>
    </testsuite>
</testsuites>`;
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

export async function parseReporterOutput(
  outputString :string,
  filePath :string,
  junitXML :string,
) :Promise<{messages: Array<Object>, output: string}> {
  const output = outputString.toString();
  let messages = [];
  try {
    if (!junitXML) {
      messages = [{
        state: 'skipped',
        title: 'No results',
        error: {
          name: '',
          message: '',
        },
        duration: 0,
        lineNumber: 0,
        filePath,
      }];
    } else {
      messages = await JunitParser(junitXML);
    }
  } catch (error) {
    atom.notifications.addError('Tester Phpunit: Could not parse data to JSON.');
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

    const junitXMLFilePath = `${tmpdir()}/junit-${(new Date().getTime())}.xml`;
    const configurationFilePath = `${tmpdir()}/phpunit-${(new Date().getTime())}.xml`;

    const phpBinary = atom.config.get('tester-phpunit.phpBinaryPath');
    const phpunitBinary = atom.config.get('tester-phpunit.phpunitBinaryPath');
    const [command, firstArgument] = getCommand(projectPath, phpBinary, phpunitBinary);

    const userConfigArgs = removeBadArgs(atom.config.get('tester-phpunit.args'));
    const additionalArgsArray = (additionalArgs && additionalArgs.trim()) ? removeBadArgs(additionalArgs.trim().split(' ')) : [];
    const defaultArgs = [
      firstArgument,
      `--log-junit=${junitXMLFilePath}`,
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
      const junitXML = existsSync(junitXMLFilePath) === true ? await readFileAsync(junitXMLFilePath, 'utf8') : generateEmptyJUnitXML(filePath);
      await unlinkAsync(configurationFilePath);
      await unlinkAsync(junitXMLFilePath);
      resolve(await parseReporterOutput(processOutput, filePath, junitXML));
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
