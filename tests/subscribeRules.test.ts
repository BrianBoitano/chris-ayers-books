import { describe, it, expect } from 'vitest';
import {
  normalizeEmail,
  isValidEmail,
  validateSubscribe,
  MAX_EMAIL_LEN,
} from '../src/lib/subscribeRules';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Chris@Example.COM ')).toBe('chris@example.com');
  });
  it('non-strings become empty', () => {
    expect(normalizeEmail(undefined)).toBe('');
    expect(normalizeEmail(42)).toBe('');
  });
});

describe('isValidEmail', () => {
  it('accepts ordinary addresses', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('first.last+tag@sub.example.com')).toBe(true);
  });
  it('rejects junk', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidEmail('no@domain')).toBe(false);
    expect(isValidEmail('two@@at.com')).toBe(false);
    expect(isValidEmail('space @x.com')).toBe(false);
  });
  it('rejects over-length', () => {
    const long = 'a'.repeat(MAX_EMAIL_LEN) + '@x.com';
    expect(isValidEmail(long)).toBe(false);
  });
});

describe('validateSubscribe', () => {
  it('returns normalized email on valid input', () => {
    expect(validateSubscribe({ email: ' Foo@Bar.com ' })).toEqual({ email: 'foo@bar.com' });
  });
  it('returns null on invalid email', () => {
    expect(validateSubscribe({ email: 'broken' })).toBeNull();
  });
  it('returns null when the honeypot is filled', () => {
    expect(validateSubscribe({ email: 'foo@bar.com', company: 'spam inc' })).toBeNull();
  });
  it('ignores an empty honeypot', () => {
    expect(validateSubscribe({ email: 'foo@bar.com', company: '   ' })).toEqual({
      email: 'foo@bar.com',
    });
  });
});
