'use babel';

/* @flow */

import { mkdirSync, rmdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import {
  getCommand,
  getConfigurationFile,
  removeBadArgs,
} from '../lib/spawn-runner';

const fixturesPath = `${__dirname}/fixtures`;

describe('spawn-runner', () => {
  describe('removeBadArgs', () => {
    it('should return clear array with args', () => {
      expect(removeBadArgs(['--log-junit', '--colors', '--my-arg'])).toEqual(['--my-arg']);
    });
  });

  describe('getCommand', () => {
    it('should return global phpunit', () => {
      expect(getCommand('', '', '')).toEqual(['phpunit', '']);
      expect(getCommand('', '/usr/bin/php', 'phpunit')).toEqual(['phpunit', '']);
    });

    it('should return custom phpunit', () => {
      expect(getCommand(__dirname, '', '/path/to/phpunit')).toEqual(['php', '/path/to/phpunit']);
      expect(getCommand(__dirname, '/usr/bin/php', '/path/to/phpunit')).toEqual(['/usr/bin/php', '/path/to/phpunit']);
      expect(getCommand(__dirname, '/usr/bin/php', '/path/to/phpunit.phar')).toEqual(['/usr/bin/php', '/path/to/phpunit.phar']);
    });

    it('should return vendor phpunit', () => {
      mkdirSync(`${fixturesPath}/vendor`);
      mkdirSync(`${fixturesPath}/vendor/phpunit`);
      mkdirSync(`${fixturesPath}/vendor/phpunit/phpunit`);
      writeFileSync(`${fixturesPath}/vendor/phpunit/phpunit/phpunit`, 'phpunit');
      expect(getCommand(fixturesPath, '', '')).toEqual(['php', `${fixturesPath}/vendor/phpunit/phpunit/phpunit`]);
      expect(getCommand(fixturesPath, '/usr/bin/php', '')).toEqual(['/usr/bin/php', `${fixturesPath}/vendor/phpunit/phpunit/phpunit`]);
      unlinkSync(`${fixturesPath}/vendor/phpunit/phpunit/phpunit`);
      rmdirSync(`${fixturesPath}/vendor/phpunit/phpunit`);
      rmdirSync(`${fixturesPath}/vendor/phpunit`);
      rmdirSync(`${fixturesPath}/vendor`);
    });
  });

  describe('getConfigurationFile', () => {
    it('should return phpunit.xml.dist', () => {
      const xmlFile = `${fixturesPath}/phpunit.xml.dist`;
      writeFileSync(xmlFile, '');
      expect(getConfigurationFile(fixturesPath, '')).toEqual(xmlFile);
      unlinkSync(xmlFile);
    });

    it('should return phpunit.xml', () => {
      const xmlFile = `${fixturesPath}/phpunit.xml`;
      writeFileSync(xmlFile, '');
      writeFileSync(`${fixturesPath}/phpunit.xml.dist`, '');
      expect(getConfigurationFile(fixturesPath, '')).toEqual(xmlFile);
      unlinkSync(xmlFile);
      unlinkSync(`${fixturesPath}/phpunit.xml.dist`);
    });

    it('should return custom.xml', () => {
      const xmlFile = `${fixturesPath}/custom.xml`;
      expect(getConfigurationFile(fixturesPath, xmlFile)).toEqual(xmlFile);

      expect(readFileSync(xmlFile).toString()).toEqual(`<?xml version="1.0" encoding="UTF-8"?>
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
      <directory suffix="Test.php">${fixturesPath}/test</directory>
      <directory suffix="Test.php">${fixturesPath}/tests</directory>
      <directory suffix="Test.php">${fixturesPath}/Test</directory>
      <directory suffix="Test.php">${fixturesPath}/Tests</directory>
    </testsuite>
  </testsuites>
</phpunit>`);

      unlinkSync(xmlFile);
    });
  });
});
