export interface Egg {
  id: string;
  // CSS selector for the hidden trigger element placed somewhere in the site.
  selector: string;
  // GM reaction context fired when found.
}
export const EGGS: Egg[] = [
  { id: 'wordmark', selector: '[data-egg="wordmark"]' },
];
