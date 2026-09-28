const AppLoader = () => {
  return (
    <div
      className="relative grid h-dvh place-items-center overflow-hidden bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading Whisper Wave"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(1,195,109,0.14)_0%,transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-green/10 blur-3xl sm:h-80 sm:w-80 lg:-left-32 lg:h-[28rem] lg:w-[28rem]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-primary/80 blur-3xl sm:h-72 sm:w-72 lg:-right-24 lg:h-96 lg:w-96"
        aria-hidden
      />

      <div className="relative flex flex-col items-center px-6">
        <div className="relative grid h-36 w-36 place-items-center sm:h-44 sm:w-44 md:h-52 md:w-52 lg:h-60 lg:w-60 xl:h-72 xl:w-72">
          <span
            className="absolute inset-0 rounded-full border border-green/25 bg-primary/40 shadow-[0_0_48px_rgba(1,195,109,0.12)] lg:shadow-[0_0_72px_rgba(1,195,109,0.16)]"
            aria-hidden
          />
          <span
            className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-green border-r-green/40 animate-loader-spin motion-reduce:animate-none sm:border-[3px] lg:border-4"
            aria-hidden
          />
          <span
            className="absolute inset-2 rounded-full border border-green/15 animate-loader-pulse motion-reduce:animate-none sm:inset-2.5 md:inset-3 lg:inset-3.5"
            aria-hidden
          />
          {/* Logo slot scales with the ring — avoids breakpoint mismatch + load pop */}
          <div className="relative z-10 flex h-[94%] w-[94%] items-center justify-center">
            <img
              src="/logo-4.png"
              alt=""
              width={512}
              height={512}
              decoding="sync"
              fetchPriority="high"
              className="h-full w-full object-contain object-center"
            />
          </div>
        </div>

        <p className="mt-8 font-display text-4xl font-semibold tracking-tight text-white sm:mt-10 sm:text-5xl md:mt-12 md:text-6xl lg:text-7xl">
          Whisper Wave
        </p>
        <p className="mt-2 text-sm text-body-300 sm:mt-3 sm:text-base md:text-lg lg:text-xl">
          Getting things ready…
        </p>

        <div
          className="mt-6 flex items-center gap-1.5 sm:mt-8 sm:gap-2 md:mt-10"
          aria-hidden
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green animate-loader-dot motion-reduce:animate-none sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-green animate-loader-dot motion-reduce:animate-none sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 [animation-delay:160ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-green animate-loader-dot motion-reduce:animate-none sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 [animation-delay:320ms]" />
        </div>
      </div>
    </div>
  );
};

export default AppLoader;
