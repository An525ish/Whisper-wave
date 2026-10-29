const GOLDEN = 137.508;
const polar = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
};

/**
 * Live radar. Blue dots (outer ring) = people searching, green linked pairs
 * (inner rings) = chats in progress. One dot per real person, capped so a
 * busy night doesn't turn it to mush; the overflow shows as "+N".
 * Positions come from the golden angle, so they are stable between refreshes.
 */
const WhisperRadar = ({ searching, chats }: { searching: number; chats: number }) => {
  const MAX_Q = 36;
  const MAX_C = 14;
  const q = Math.min(searching, MAX_Q);
  const c = Math.min(chats, MAX_C);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
      {/* rotating sweep */}
      <div
        className="absolute inset-[3%] animate-spin rounded-full motion-reduce:animate-none"
        style={{ animationDuration: '6s', background: 'conic-gradient(from 0deg, transparent 72%, rgba(1,195,109,.28) 100%)' }}
      />
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" role="img" aria-label={`${searching} searching, ${chats} chatting`}>
        {[30, 60, 92].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,.09)" strokeDasharray={r === 92 ? undefined : '2 4'} />
        ))}
        <line x1="100" y1="6" x2="100" y2="194" stroke="rgba(255,255,255,.05)" />
        <line x1="6" y1="100" x2="194" y2="100" stroke="rgba(255,255,255,.05)" />

        {Array.from({ length: c }, (_, i) => {
          const ang = i * GOLDEN;
          const r = 22 + ((i * 7) % 5) * 8;
          const [x, y] = polar(r, ang);
          const [x2, y2] = polar(r + 6, ang + 14);
          return (
            <g key={`c${i}`}>
              <line x1={x} y1={y} x2={x2} y2={y2} stroke="#01c36d" strokeOpacity=".6" />
              <circle cx={x} cy={y} r="2.6" fill="#01c36d" style={{ filter: 'drop-shadow(0 0 3px #01c36d)' }} />
              <circle cx={x2} cy={y2} r="2.6" fill="#01c36d" style={{ filter: 'drop-shadow(0 0 3px #01c36d)' }} />
            </g>
          );
        })}

        {Array.from({ length: q }, (_, i) => {
          const [x, y] = polar(70 + ((i * 5) % 5) * 5, i * GOLDEN + 40);
          return (
            <circle key={`q${i}`} cx={x} cy={y} r="2.4" fill="#3a9bd9" className="animate-pulse motion-reduce:animate-none"
              style={{ animationDelay: `${(i % 7) * 0.3}s`, filter: 'drop-shadow(0 0 3px #3a9bd9)' }} />
          );
        })}

        <circle cx="100" cy="100" r="3" fill="#fff" fillOpacity=".8" />
      </svg>

      {(searching > MAX_Q || chats > MAX_C) && (
        <p className="absolute bottom-1 right-2 text-[10px] text-body-300/70">
          +{Math.max(searching - MAX_Q, 0) + Math.max(chats - MAX_C, 0) * 2} more
        </p>
      )}
    </div>
  );
};

export default WhisperRadar;
