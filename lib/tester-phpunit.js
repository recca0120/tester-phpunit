'use babel';

/* @flow */
import type { TextEditor } from 'atom';
import * as phpunitRunner from './spawn-runner';

export function activate() {
  require('atom-package-deps').install();
}

export function deactivate() {
  // Fill something here, optional
}

export function provideTester() {
  return {
    name: 'tester-phpunit',
    options: {},
    scopes: atom.config.get('tester-phpunit.scopes'),
    test(textEditor :?TextEditor, additionalArgs: ?string) {
      // Note, a Promise may be returned as well!
      return phpunitRunner.run(textEditor, additionalArgs);
    },
    stop() {
      phpunitRunner.stop();
    },
  };
}
