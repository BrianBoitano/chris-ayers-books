import { describe, it, expect } from 'vitest';
import { workSchema, bookSchema } from '../src/content/schema';

describe('workSchema', () => {
  it('accepts a hosted series', () => {
    const r = workSchema.safeParse({
      title: 'Some Series', type: 'series', status: 'coming-soon',
      tagline: 'A thing happens.', accentColor: '#ff0066', order: 2,
    });
    expect(r.success).toBe(true);
  });
  it('accepts an external work with a url', () => {
    const r = workSchema.safeParse({
      title: 'The Broadcast', type: 'series', status: 'live',
      tagline: 'Laugh first. Pay later.', accentColor: '#39d0d8', order: 1,
      externalUrl: 'https://thebroadcastseries.com',
    });
    expect(r.success).toBe(true);
  });
  it('rejects a bad status', () => {
    const r = workSchema.safeParse({
      title: 'X', type: 'series', status: 'published',
      tagline: 't', accentColor: '#fff', order: 1,
    });
    expect(r.success).toBe(false);
  });
  it('rejects a non-url externalUrl', () => {
    const r = workSchema.safeParse({
      title: 'X', type: 'series', status: 'live',
      tagline: 't', accentColor: '#fff', order: 1, externalUrl: 'not-a-url',
    });
    expect(r.success).toBe(false);
  });
  it('accepts an optional position override', () => {
    const r = workSchema.safeParse({
      title: 'X', type: 'series', status: 'live',
      tagline: 't', accentColor: '#fff', order: 1,
      position: { x: 20, y: 60 },
    });
    expect(r.success).toBe(true);
  });
  it('rejects a malformed position', () => {
    const r = workSchema.safeParse({
      title: 'X', type: 'series', status: 'live',
      tagline: 't', accentColor: '#fff', order: 1,
      position: { x: 'nope' },
    });
    expect(r.success).toBe(false);
  });
});

describe('bookSchema', () => {
  it('links to a parent work', () => {
    const r = bookSchema.safeParse({
      title: 'Book One', work: 'some-series', order: 1,
      amazonUrl: 'https://amazon.com/dp/x',
    });
    expect(r.success).toBe(true);
  });
});
