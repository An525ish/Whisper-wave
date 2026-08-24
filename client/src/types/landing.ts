export type ChatMessageSender = 'a' | 'b';

export type ChatScriptEntry = {
  sender: ChatMessageSender;
  text: string;
  delayMs: number;
  isVibe?: boolean;
  isMutual?: boolean;
};

export type ChatPlaybackState = 'typing' | 'visible' | 'idle';

export type ChatMessage = {
  id: number;
  sender: ChatMessageSender;
  text: string;
  state: ChatPlaybackState;
  isVibe?: boolean;
  isMutual?: boolean;
};
