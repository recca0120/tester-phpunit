'use babel'

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
      const editorPath = textEditor.getPath()

      // Note, a Promise may be returned as well!
      return [{
        type: 'Error',
        text: 'Something went wrong',
        range: [[0,0], [0,1]],
        filePath: editorPath
      }]
    }
  }
}
