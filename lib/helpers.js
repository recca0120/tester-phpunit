'use babel';

import { parseString } from 'xml2js';

export function xml2json(xml :string) :string {
  return new Promise((resolve) => {
    parseString(xml, (error, json) => {
      if (error) {
        resolve(error);
        return;
      }

      resolve(json);
    });
  });
}

export function crlf2lf(str :string) :string {
  return str.replace(/\r\n/g, '\n');
}

export function replaceFirst(str :string, search :string) :string {
  const length = str.indexOf(search);

  return length === -1 ? str : str.substr(length + search.length);
}

export function getClassName(filePath :string) :string {
  const name = filePath.replace(/\\/g, '/');

  return name.substr(name.lastIndexOf('/') + 1).replace(/\.php$/i, '');
}
