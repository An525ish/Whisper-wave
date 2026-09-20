/**
 * Soft violet glow behind the chat pane (earlier look), calm and still.
 */
const HeroAtmosphere = () => (
  <>
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <div className="absolute left-1/2 top-1/2 size-[min(92vh,780px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 mix-blend-screen blur-[64px] bg-[radial-gradient(circle,rgba(139,107,255,0.5),transparent_62%)] min-[900px]:left-[64%]" />
      <div className="absolute bottom-[-14%] left-[-10%] size-[46vw] rounded-full opacity-60 mix-blend-screen blur-[80px] bg-[radial-gradient(circle,rgba(53,224,200,0.36),transparent_66%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_88%_at_50%_42%,transparent_56%,rgba(26,21,32,0.55)_100%)] min-[900px]:bg-[radial-gradient(115%_85%_at_64%_45%,transparent_54%,rgba(26,21,32,0.55)_100%)]" />
    </div>
    <div className="lw-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.04] mix-blend-overlay" aria-hidden />
  </>
);

export default HeroAtmosphere;
