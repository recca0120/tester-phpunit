'use babel';

/* @flow */
import * as mochaRunner from './mocha-runner';

export function activate() {
  // Fill something here, optional
}

export function deactivate() {
  // Fill something here, optional
}

export function provideTester() {
  return {
    name: 'tester-mocha',
    scope: 'file',
    grammarScopes: ['*.js'],
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
