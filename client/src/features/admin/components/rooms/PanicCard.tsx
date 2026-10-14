import { usePanicCard } from '../../hooks/usePanicCard';

/**
 * The incident switch: one surface off or back on immediately, no deploy.
 * A restart resets to env — flags stay the durable state, this is the panic
 * button. Logged server-side as such.
 */
const PanicCard = () => {
  const { toggles, isLoading, isError, refetch, flipping, toggle, ready } = usePanicCard();

  return (
    <section aria-label="Feature kill switches" className="rounded-2xl border border-red/30 bg-red/5 p-5">
      <h2 className="text-base font-semibold text-white">Panic card</h2>
      <p className="mt-1 text-sm text-body-300">
        Disable a surface instantly. A restart resets to deploy flags.
      </p>

      {isLoading && (
        <div aria-label="Loading feature flags" className="mt-3 h-10 animate-pulse rounded-full bg-white/5 motion-reduce:animate-none" />
      )}

      {isError && (
        <div role="alert" className="mt-3 flex items-center gap-3 text-sm text-red">
          Couldn&apos;t load the current flags.
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-full border border-border/50 px-3 py-1.5 text-xs font-semibold text-body-300 hover:text-body"
          >
            Try again
          </button>
        </div>
      )}

      {ready && (
        <div className="mt-3 flex flex-wrap gap-2">
          {toggles.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void toggle(item.id, !item.on)}
              disabled={flipping}
              aria-pressed={item.on}
              className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                item.on
                  ? 'bg-red/20 text-red hover:bg-red/30'
                  : 'border border-border bg-white/5 text-body-300 hover:text-body'
              }`}
            >
              {item.label}: {item.on ? 'ON — disable' : 'off — enable'}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default PanicCard;
