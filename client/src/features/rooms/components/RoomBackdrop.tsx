import AmbientBackdrop from '@/shared/components/ui/backdrop/AmbientBackdrop';

type Props = {
  /** Add the teal glow (the live thread) on top of the violet one. */
  teal?: boolean;
};

/** The quiet violet mesh behind a room page. Decorative only. */
const RoomBackdrop = ({ teal = false }: Props) => (
  <AmbientBackdrop className="rm-bg" teal={teal} green={false} />
);

export default RoomBackdrop;
