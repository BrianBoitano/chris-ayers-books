import type { GmContext } from '../lib/gm';

// Sarcastic, never mean. No DCC references. No em dashes.
export const GM_LINES: Record<GmContext, string[]> = {
  greeting: [
    "Oh good, you're back. Pick something this time.",
    "Welcome to the catalog. Try not to break anything.",
    "Choose a world. I have been bored for exactly forever.",
  ],
  tileHover: [
    "Bold choice. Hovering. Truly the height of commitment.",
    "Click it. I dare you. I literally cannot stop you.",
  ],
  lockedTile: [
    "Locked. Like the author's sleep schedule. Check back.",
    "You can rattle the handle all you want. Not ready.",
  ],
  idle: [
    "Still here? Me too. Neither of us has anywhere to be.",
    "I can hear you not clicking.",
  ],
  eggFound: [
    "Datashard logged. There are more. Keep turning things over.",
    "Found one. The map is hiding others. Obviously.",
    "Nice. A real one. Most people never look this hard.",
  ],
  signup: [
    "You joined the list. The newsletter equivalent of choosing the good ending.",
    "Welcome to the party. There are no snacks, only books.",
  ],
  notFound: [
    "This page does not exist. Neither does my patience. 404.",
    "You broke the map. Impressive. Go home.",
  ],
};
