import { describe, it, expect } from 'vitest';
import { SITE_URL, SITE_NAME, AUTHOR_NAME, FOLLOW_LINKS } from '../src/config';

describe('site config', () => {
  it('points at the hub domain', () => {
    expect(SITE_URL).toBe('https://chrisayersbooks.com');
  });
  it('is the author brand, not a series', () => {
    expect(SITE_NAME).toBe('Chris Ayers');
    expect(AUTHOR_NAME).toBe('Christopher Ayers');
  });
  it('every follow link has label, url, glyph', () => {
    expect(FOLLOW_LINKS.length).toBeGreaterThan(0);
    for (const l of FOLLOW_LINKS) {
      expect(typeof l.label).toBe('string');
      expect(l.url).toMatch(/^https?:\/\//);
      expect(typeof l.glyph).toBe('string');
    }
  });
});
