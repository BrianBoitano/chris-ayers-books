export const SITE_NAME = 'Chris Ayers';
export const SITE_URL = 'https://chrisayersbooks.com';
export const SITE_TAGLINE = 'Stories from a dangerously overclocked imagination.';
export const AUTHOR_NAME = 'Christopher Ayers';

// Amazon Author Central page. Set to '' to hide author-page links.
export const AUTHOR_AMAZON_URL =
  'https://www.amazon.com/stores/Christopher-Ayers/author/B0H594PG8S';

// Support / tip link. Set to '' to hide.
export const SUPPORT_URL = 'https://buymeacoffee.com/brianboitat';

// Google Search Console verification token. From Search Console, choose the
// "HTML tag" method and paste ONLY the content="..." value here (not the whole
// tag), then push. Leave '' to render no verification meta.
export const GSC_VERIFICATION = 'GJUuu_v7SmE3I-irrlEJ3OkA3eycexPtsZ9cKTPA-Z0';

export interface FollowLink {
  label: string;
  url: string;
  glyph: string;
}
export const FOLLOW_LINKS: FollowLink[] = [
  { label: 'Read on Royal Road', url: 'https://www.royalroad.com/profile/1000657/fictions', glyph: '📖' },
  { label: 'Amazon Author Page', url: AUTHOR_AMAZON_URL, glyph: '▶' },
  { label: 'Buy Me a Coffee', url: SUPPORT_URL, glyph: '☕' },
];
