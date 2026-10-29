import { usePushNotifications } from '../hooks/usePushNotifications';
import type { PushUiState } from '../types';

const HINTS: Partial<Record<PushUiState, string>> = {
  on: 'You will be alerted when the app is in the background.',
  off: 'Get alerts for messages and requests when the app is closed.',
  denied: 'Blocked in your browser. Allow notifications in site settings to turn on.',
  install: 'Add Whisper Wave to your Home Screen to enable push on iOS.',
  unsupported: 'Push notifications are not supported in this browser.',
};

const PushToggle = () => {
  const { state, isPending, enable, disable } = usePushNotifications();
  if (state === 'hidden') return null;

  const isOn = state === 'on';
  const canToggle = state === 'on' || state === 'off';

  return (
    <section
      aria-labelledby="push-toggle-title"
      className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-3 py-2.5 sm:mx-5"
    >
      <div className="min-w-0 flex-1">
        <p id="push-toggle-title" className="text-sm font-semibold text-white">
          Push notifications{isOn ? ': On' : ''}
        </p>
        <p className="text-xs text-body-300">{HINTS[state]}</p>
      </div>
      {canToggle ? (
        <button
          type="button"
          onClick={isOn ? disable : enable}
          disabled={isPending}
          className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ring-1 ring-inset transition focus-visible:outline-2 focus-visible:outline-green disabled:cursor-default disabled:opacity-60 ${
            isOn
              ? 'text-body-300 ring-white/12 hover:bg-white/6 hover:text-body'
              : 'bg-green/10 text-green ring-green/30 hover:bg-green/20'
          }`}
        >
          {isOn ? 'Turn off' : 'Turn on'}
        </button>
      ) : null}
    </section>
  );
};

export default PushToggle;
