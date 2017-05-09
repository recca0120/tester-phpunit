'use babel';

/* @flow */

import {
  removeBadArgs,
} from '../lib/spawn-runner';

describe('spawn-runner', () => {
  describe('removeBadArgs', () => {
    it('should return clear array with args', () => {
      expect(removeBadArgs(['--log-junit', '--colors', '--my-arg'])).toEqual(['--my-arg']);
    });
  });
});
