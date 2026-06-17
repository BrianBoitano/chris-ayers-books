export const SITE_NAME = 'Chris Ayers';
export const SITE_URL = 'https://chrisayersbooks.com';
export const SITE_TAGLINE = 'Stories from a dangerously overclocked imagination.';
export const AUTHOR_NAME = 'Christopher Ayers';

// Amazon Author Central page. Set to '' to hide author-page links.
export const AUTHOR_AMAZON_URL =
  'https://www.amazon.com/stores/Christopher-Ayers/author/B0H594PG8S';

// Support / tip link. Set to '' to hide.
export const SUPPORT_URL = 'https://buymeacoffee.com/brianboitat';

export interface FollowLink {
  label: string;
  url: string;
  glyph: string;
}
export const FOLLOW_LINKS: FollowLink[] = [
  { label: 'Amazon Author Page', url: AUTHOR_AMAZON_URL, glyph: '▶' },
  { label: 'Buy Me a Coffee', url: SUPPORT_URL, glyph: '☕' },
];
