import { CONNECT_BAR_TICK_MS } from '../constants';
import { useConnectDeadline } from '../hooks/useConnectDeadline';

type Props = {
  connectToken: string;
  mutualAt: number | null;
  partnerLeft: boolean;
  onOpen: () => void;
};

/**
 * Mutual — offer the DM once the celebration modal has been dismissed. Gone once
 * the connect window has closed (the token no longer works).
 */
export default function MutualBar({ connectToken, mutualAt, partnerLeft, onOpen }: Props) {
  const { expired } = useConnectDeadline(connectToken, mutualAt, CONNECT_BAR_TICK_MS);
  if (expired) return null;

  return (
    <div className="acr-mutual-bar" role="status">
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-green">Mutual vibe</p>
        <p className="mt-0.5 text-xs font-medium text-body-300">
          {partnerLeft
            ? 'They left, but you can still open a DM for a few minutes'
            : 'It’s a vibe — open a DM before the window closes'}
        </p>
      </div>
      <button type="button" className="acr-mutual-bar__cta" onClick={onOpen}>
        Open DM
      </button>
    </div>
  );
}
