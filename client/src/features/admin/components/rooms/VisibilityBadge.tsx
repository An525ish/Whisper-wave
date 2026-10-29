import type { AdminRoomVisibility } from '../../types';

type Props = {
  visibility: AdminRoomVisibility;
};

const TONES: Record<AdminRoomVisibility, string> = {
  official: 'bg-green/15 text-green ring-green/25',
  public: 'bg-blue/15 text-blue ring-blue/25',
  unlisted: 'bg-yellow/15 text-yellow ring-yellow/25',
  private: 'bg-red/15 text-red ring-red/25',
};

const VisibilityBadge = ({ visibility }: Props) => (
  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset ${TONES[visibility]}`}>
    {visibility}
  </span>
);

export default VisibilityBadge;
