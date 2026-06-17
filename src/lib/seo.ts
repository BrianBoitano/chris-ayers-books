import { SITE_URL, SITE_NAME, AUTHOR_NAME, AUTHOR_AMAZON_URL } from '../config';

export function bookLd(b: { title: string; description: string; url: string; image?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: b.title,
    author: { '@type': 'Person', name: AUTHOR_NAME },
    url: b.url,
    ...(b.image ? { image: b.image } : {}),
    description: b.description,
    inLanguage: 'en',
  };
}

export function worksLd(items: { title: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: SITE_NAME,
    author: { '@type': 'Person', name: AUTHOR_NAME },
    hasPart: items.map((w) => ({ '@type': 'CreativeWork', name: w.title, url: w.url })),
  };
}

export function personLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    url: `${SITE_URL}/about`,
    jobTitle: 'Author',
    ...(AUTHOR_AMAZON_URL ? { sameAs: [AUTHOR_AMAZON_URL] } : {}),
  };
}
