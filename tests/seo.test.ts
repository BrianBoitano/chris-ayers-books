import { describe, it, expect } from 'vitest';
import { bookLd, worksLd, personLd } from '../src/lib/seo';

describe('bookLd', () => {
  it('builds schema.org Book json-ld', () => {
    const ld: any = bookLd({ title: 'T', description: 'D', url: 'https://x/y' });
    expect(ld['@type']).toBe('Book');
    expect(ld.name).toBe('T');
    expect(ld.author.name).toBe('Christopher Ayers');
  });
});

describe('worksLd', () => {
  it('lists works as a collection', () => {
    const ld: any = worksLd([{ title: 'A', url: 'https://x/a' }]);
    expect(ld['@type']).toBe('CollectionPage');
    expect(ld.hasPart[0].name).toBe('A');
  });
});

describe('personLd', () => {
  it('describes the author', () => {
    const ld: any = personLd();
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Christopher Ayers');
  });
});
