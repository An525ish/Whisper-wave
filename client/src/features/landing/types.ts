type ChatMessageSender = 'a' | 'b';

export type ChatScriptEntry = {
  sender: ChatMessageSender;
  text: string;
  delayMs: number;
  isVibe?: boolean;
  isMutual?: boolean;
};

type ChatPlaybackState = 'typing' | 'visible' | 'idle';

export type ChatMessage = {
  id: number;
  sender: ChatMessageSender;
  text: string;
  state: ChatPlaybackState;
  isVibe?: boolean;
  isMutual?: boolean;
};

/** Hero Match Arc — the page's opening story beats. */
export type MatchArcPhase = 'searching' | 'matched' | 'chatting' | 'spark';

/** Colour meaning in the bento grid: violet = stranger, teal = you, spark = connection. */
export type BentoTone = 'violet' | 'teal' | 'spark';

/** Safety section — which step of the age gate / exits / dissolve loop is showing. */
export type SafetyBeat = 0 | 1 | 2;

/** Hero left column follows three beats — `matched` keeps showing `searching`. */
export type HeroLeftBeat = 'searching' | 'chatting' | 'spark';

export type HeroCopyBlock = {
  kicker: string;
  line1: string;
  line2: string;
  accent?: string;
  body: [string, string, string];
  cta: string;
};
