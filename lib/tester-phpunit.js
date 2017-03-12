'use babel';

/* @flow */
import * as phpunitRunner from './spawn-runner';
/* flow-include
import type { TextEditor } from 'atom'
*/

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
    test(textEditor/* :TextEditor*/) {
      if (!textEditor) {
        return Promise.resolve({ messages: [], output: '' });
      }
      const text = textEditor.getText();
      if (text.length === 0) {
        return Promise.resolve({ messages: [], output: '' });
      }
      // Note, a Promise may be returned as well!
      return phpunitRunner.run(textEditor);
    },
    stop() {
      phpunitRunner.stop();
    },
  };
}
