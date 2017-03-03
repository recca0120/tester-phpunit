'use babel';

/* @flow */
import * as mochaRunner from './spawn-runner';

export function activate() {
  require('atom-package-deps').install();
}

export function deactivate() {
  // Fill something here, optional
}

export function provideTester() {
  return {
    name: 'tester-mocha',
    scopes: atom.config.get('tester-mocha.scopes'),
    test(textEditor) {
      if (!textEditor) {
        return Promise.resolve({ messages: [], output: '' });
      }
      const text = textEditor.getText();
      if (text.length === 0) {
        return Promise.resolve({ messages: [], output: '' });
      }
      console.log('test-mocha', mochaRunner.run);
      // Note, a Promise may be returned as well!
      return mochaRunner.run(textEditor);
    },
  };
}
