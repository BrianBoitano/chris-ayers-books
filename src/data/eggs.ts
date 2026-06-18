export interface Egg {
  id: string;
  // CSS selector for the hidden trigger element placed somewhere in the site.
  selector: string;
  // GM reaction context fired when found.
}
export const EGGS: Egg[] = [
  { id: 'wordmark', selector: '[data-egg="wordmark"]' },
  { id: 'footer', selector: '[data-egg="footer"]' },
  { id: 'dossier', selector: '[data-egg="dossier"]' },
  { id: 'archive', selector: '[data-egg="archive"]' },
  { id: 'notfound', selector: '[data-egg="notfound"]' },
];
