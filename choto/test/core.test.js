import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUrl } from '../src/validate.js';
import { LRU } from '../src/cache.js';
import { newCode, CODE_RE } from '../src/code.js';

test('validateUrl accepts http(s) and normalizes', () => {
  assert.equal(validateUrl('  https://example.com/a?x=1 ', 'choto.link').ok, true);
  assert.equal(validateUrl('http://example.com', 'choto.link').url, 'http://example.com/');
});

test('validateUrl rejects bad input', () => {
  for (const bad of [
    'javascript:alert(1)',
    'data:text/html,hi',
    'ftp://example.com',
    'not a url',
    '',
    42,
    'https://user:pw@example.com',
    'https://choto.link/abc1234',
    'https://example.com/' + 'a'.repeat(2100),
  ]) {
    assert.equal(validateUrl(bad, 'choto.link').ok, false, String(bad));
  }
});

test('newCode produces 7 base62 chars', () => {
  for (let i = 0; i < 200; i++) assert.match(newCode(), CODE_RE);
});

test('LRU evicts least recently used and expires entries', async () => {
  const c = new LRU(2, 20);
  c.set('a', 1);
  c.set('b', 2);
  c.get('a'); // a is now most recent
  c.set('c', 3); // evicts b
  assert.equal(c.get('b'), undefined);
  assert.equal(c.get('a'), 1);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(c.get('a'), undefined);
});
