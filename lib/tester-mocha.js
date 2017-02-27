'use babel';

/* @flow */
import { mochaRun } from './mocha-runner';

export function activate() {
  // Fill something here, optional
}

export function deactivate() {
  // Fill something here, optional
}

export function provideTester() {
  return {
    name: 'Example',
    scope: 'file', // or 'project'
    testsOnChange: false, // or true
    grammarScopes: ['*.js'],
    test(textEditor) {
      // Note, a Promise may be returned as well!
      return mochaRun(textEditor);
    },
  };
}
