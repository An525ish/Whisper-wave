/** Other apps by the same maker, shown on `/apps`. Add an entry to list another. */
export const HUB_APPS = [
  {
    id: 'whispr',
    name: 'Whispr',
    tagline: 'Send anonymous confessions to anyone. No account needed.',
    url: 'https://whisprit.an525ish.site/',
    icon: 'https://whisprit.an525ish.site/favicon-96x96.png',
    /** Tints the page glow and buttons while this app is selected. */
    accent: '#f5b942',
    about:
      'You write a confession, pick who it is for, and it reaches them sealed. They read it. Nobody sees who wrote it.',
    why: 'Whisper Wave is a live chat with a stranger. Whispr is the other half: the thing you want to say once, to someone you know, without it becoming a conversation. Same maker, same rule of not keeping what it does not need.',
    highlights: [
      { icon: 'lock', label: 'No account', note: 'Open it and write.' },
      { icon: 'mask', label: 'Anonymous sender', note: 'They never see your name.' },
      { icon: 'free', label: 'Free', note: 'No plan, no paywall.' },
    ],
  },
] as const;

export const GAME_TAGS = ['All', 'Draw', 'Word', 'Party', 'Board', 'Arcade'] as const;
export type GameTag = (typeof GAME_TAGS)[number];

/**
 * Free browser games on other sites, listed on `/games`. We link out in a new
 * tab and never embed: they run their own ads and public chat. Add one object
 * to list another. `players` is a plain-language range.
 */
export const HUB_GAMES = [
  { id: 'skribbl', featured: true, emoji: '✏️', best: 'Friends or strangers', name: 'skribbl.io', tag: 'Draw', players: '2 to 20', blurb: 'Draw the word while everyone guesses. Fastest guess wins points.', url: 'https://skribbl.io/', hue: '#f59e0b' },
  { id: 'gartic', emoji: '📞', best: 'Friends', name: 'Gartic Phone', tag: 'Party', players: '4 to 30', blurb: 'Telephone with drawings. Write, draw, repeat, then laugh at what it became.', url: 'https://garticphone.com/', hue: '#a78bfa' },
  { id: 'sketchful', emoji: '🎨', best: 'Friends or strangers', name: 'Sketchful', tag: 'Draw', players: '2 to 12', blurb: 'Another draw and guess game, with custom word lists for your group.', url: 'https://sketchful.io/', hue: '#38bdf8' },
  { id: 'codenames', emoji: '🕵️', best: 'Friends', name: 'Codenames', tag: 'Word', players: '4 or more', blurb: 'Two teams, one-word clues, 25 words on the table. Don’t hit the assassin.', url: 'https://codenames.game/', hue: '#fb7185' },
  { id: 'typeracer', emoji: '⌨️', best: 'Strangers', name: 'TypeRacer', tag: 'Word', players: '1 to 5', blurb: 'Race people at typing a quote. Quick rounds, no sign up.', url: 'https://play.typeracer.com/', hue: '#34d399' },
  { id: 'lichess', emoji: '♟️', best: 'Strangers or a friend', name: 'Lichess', tag: 'Board', players: '2', blurb: 'Free chess with no ads. Play a stranger or send a link to a friend.', url: 'https://lichess.org/', hue: '#e5e7eb' },
  { id: 'tetrio', emoji: '🧱', best: 'Strangers', name: 'TETR.IO', tag: 'Arcade', players: '1 to many', blurb: 'Multiplayer Tetris. Clear lines to send garbage at your opponent.', url: 'https://tetr.io/', hue: '#22d3ee' },
  { id: 'bonk', emoji: '💥', best: 'Friends or strangers', name: 'Bonk.io', tag: 'Arcade', players: '2 to 8', blurb: 'Tiny physics brawls. Knock people off the map or race to the finish.', url: 'https://bonk.io/', hue: '#f472b6' },
  { id: 'agar', emoji: '🟢', best: 'Strangers', name: 'Agar.io', tag: 'Arcade', players: 'Open lobby', blurb: 'Eat smaller blobs, avoid bigger ones. Easy to start, hard to stop.', url: 'https://agar.io/', hue: '#4ade80' },
] as const;

/** What people can send from `/feedback`. `to` addresses are in `LEGAL_CONTACT`. */
export const FEEDBACK_KINDS = [
  { id: 'app', label: 'Suggest an app', hint: 'Something you wish existed next to Whisper Wave.', subject: 'App suggestion' },
  { id: 'feedback', label: 'Give feedback', hint: 'What works, what annoys you, what to change.', subject: 'Feedback' },
  { id: 'problem', label: 'Report a problem', hint: 'A bug, a complaint, or something that felt wrong.', subject: 'Problem report' },
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]['id'];

/** Analytics event names for the hub (emitted via `shared/lib/analytics` `track`). */
export const HUB_EVENTS = {
  /** Hub home rendered. */
  VIEW: 'hub_view',
  /** A hub card was tapped. Carries `{ card }` — never PII. */
  CARD_CLICK: 'hub_card_click',
  /** A primary-nav destination was tapped. Carries `{ dest }` — never PII. */
  NAV_CLICK: 'nav_click',
} as const;
