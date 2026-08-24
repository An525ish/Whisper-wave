import { useAnimatedChat } from '@/hooks/landing/useAnimatedChat';
import type { ChatMessage } from '@/types/landing';
import { useEffect, useRef } from 'react';

const TypingDots = () => (
  <span className="landing-chat__typing-dots" aria-label="typing">
    <span />
    <span />
    <span />
  </span>
);

const Bubble = ({ msg }: { msg: ChatMessage }) => {
  const isA = msg.sender === 'a';

  if (msg.isMutual) {
    return (
      <div className="landing-chat__mutual">
        <span className="landing-chat__mutual-spark">✦</span>
        {msg.state === 'typing' ? <TypingDots /> : <span>{msg.text}</span>}
      </div>
    );
  }

  if (msg.isVibe) {
    return (
      <div className="landing-chat__vibe-notice">
        {msg.state === 'typing' ? <TypingDots /> : <span>{msg.text}</span>}
      </div>
    );
  }

  return (
    <div className={`landing-chat__row${isA ? '' : ' landing-chat__row--b'}`}>
      {msg.state === 'typing' ? (
        <div className={`landing-chat__bubble${isA ? '' : ' landing-chat__bubble--b'}`}>
          <TypingDots />
        </div>
      ) : (
        <div className={`landing-chat__bubble${isA ? '' : ' landing-chat__bubble--b'} landing-chat__bubble--in`}>
          {msg.text}
        </div>
      )}
    </div>
  );
};

const AnimatedChatWindow = () => {
  const { messages } = useAnimatedChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="landing-chat" aria-hidden>
      {/* Header */}
      <div className="landing-chat__header">
        <div className="landing-chat__header-left">
          <div className="landing-chat__avatar landing-chat__avatar--a">
            <span>M</span>
          </div>
          <div>
            <p className="landing-chat__name">midnight_fox</p>
            <p className="landing-chat__sub">+ blue_static</p>
          </div>
        </div>
        <div className="landing-chat__online">
          <span className="landing-chat__online-dot" />
          <span>live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="landing-chat__body scrollbar-hide" ref={scrollRef}>
        {/* Illustration — two people separated by a signal wave */}
        <div className="landing-chat__illustration" aria-hidden>
          <svg viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left figure */}
            <circle cx="34" cy="28" r="13" fill="rgba(1,195,109,0.15)" stroke="rgba(1,195,109,0.4)" strokeWidth="1.2" />
            <text x="34" y="33" textAnchor="middle" fontSize="13" fill="rgba(1,195,109,0.7)">👤</text>
            <rect x="20" y="44" width="28" height="18" rx="6" fill="rgba(1,195,109,0.08)" stroke="rgba(1,195,109,0.25)" strokeWidth="1" />

            {/* Signal wave between them */}
            <path
              d="M62 44 C 72 32, 82 56, 92 44 S 112 32, 122 44 S 142 56, 152 44"
              stroke="rgba(1,195,109,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="4 3"
              className="landing-chat__sine-path"
            />

            {/* Right figure */}
            <circle cx="186" cy="28" r="13" fill="rgba(86,152,255,0.12)" stroke="rgba(86,152,255,0.35)" strokeWidth="1.2" />
            <text x="186" y="33" textAnchor="middle" fontSize="13" fill="rgba(86,152,255,0.7)">👤</text>
            <rect x="172" y="44" width="28" height="18" rx="6" fill="rgba(86,152,255,0.06)" stroke="rgba(86,152,255,0.2)" strokeWidth="1" />

            {/* Anonymous labels */}
            <text x="34" y="74" textAnchor="middle" fontSize="7.5" fill="rgba(235,236,236,0.35)" fontFamily="DM Sans, sans-serif">midnight_fox</text>
            <text x="186" y="74" textAnchor="middle" fontSize="7.5" fill="rgba(235,236,236,0.35)" fontFamily="DM Sans, sans-serif">blue_static</text>

            {/* Center dot */}
            <circle cx="110" cy="44" r="2.5" fill="rgba(1,195,109,0.5)" />
          </svg>
          <p className="landing-chat__illustration-caption">anonymous match — no profile, no judgement</p>
        </div>

        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} />
        ))}
      </div>

      {/* Input mock */}
      <div className="landing-chat__input-mock">
        <span className="landing-chat__input-cursor" />
        <span className="landing-chat__input-placeholder">say something...</span>
        <div className="landing-chat__send-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AnimatedChatWindow;
