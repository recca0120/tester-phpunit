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
    name: 'Example',
    scope: 'file', // or 'project'
    testsOnChange: false, // or true
    grammarScopes: ['*.js'],
    test(textEditor) {
      console.log('test-mocha', mochaRunner.run);
      // Note, a Promise may be returned as well!
      return mochaRunner.run(textEditor);
    },
  };
}
