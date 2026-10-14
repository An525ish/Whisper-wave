import type { AdminRoomVisibility } from '../../types';

type Props = {
  visibility: AdminRoomVisibility;
};

const TONES: Record<AdminRoomVisibility, string> = {
  official: 'bg-green/15 text-green',
  public: 'bg-white/10 text-body',
  unlisted: 'bg-yellow/15 text-yellow',
  private: 'bg-red/15 text-red',
};

const VisibilityBadge = ({ visibility }: Props) => (
  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONES[visibility]}`}>{visibility}</span>
);

export default VisibilityBadge;
