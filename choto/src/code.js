import { randomInt } from 'node:crypto';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const CODE_LENGTH = 7;
export const CODE_RE = /^[0-9A-Za-z]{7}$/;

// 7-char paths that are routes of their own and must never be issued as codes.
const RESERVED = new Set(['healthz']);

export function newCode() {
  let code;
  do {
    code = Array.from({ length: CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  } while (RESERVED.has(code));
  return code;
}
