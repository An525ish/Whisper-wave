import { usePanicCard } from '../../hooks/usePanicCard';
import Switch from '../shared/Switch';

/**
 * The incident switch: one surface off or back on immediately, no deploy.
 * A restart resets to env, so flags stay the durable state and this is the
 * panic button. Logged server-side as such.
 */
const PanicCard = () => {
  const { toggles, isLoading, isError, refetch, flipping, toggle, ready } = usePanicCard();

  return (
    <section aria-label="Feature kill switches" className="rounded-2xl border border-red/25 bg-red/[0.04] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-white">Kill switches</h2>
        <p className="text-xs text-body-300">Takes effect at once. A restart goes back to the deploy flags.</p>
      </div>

      {isLoading && (
        <div aria-label="Loading feature flags" className="mt-4 h-14 animate-pulse rounded-xl bg-white/5 motion-reduce:animate-none" />
      )}

      {isError && (
        <div role="alert" className="mt-4 flex items-center gap-3 text-sm text-red">
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
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {toggles.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-black-light/30 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-body">{item.label}</p>
                <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${item.on ? 'text-green' : 'text-red'}`}>
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${item.on ? 'bg-green' : 'bg-red'}`} />
                  {item.on ? 'Live' : 'Switched off'}
                </p>
              </div>
              <Switch
                on={item.on}
                onChange={(next) => void toggle(item.id, next)}
                disabled={flipping}
                label={`${item.label}: ${item.on ? 'switch off' : 'switch on'}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default PanicCard;
