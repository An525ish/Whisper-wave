import AmbientBackdrop from '@/shared/components/ui/backdrop/AmbientBackdrop';
import BokehCrowd from '@/shared/components/ui/backdrop/BokehCrowd';

/**
 * Full-page atmosphere for the hub home: the shared backdrop with the same
 * tuning and drifting lights as Rooms (violet mesh, teal glow, no green).
 * Decorative, `aria-hidden` by the component itself.
 */
const HomeBackdrop = () => (
  <AmbientBackdrop className="hw-bg" green={false}>
    <BokehCrowd />
  </AmbientBackdrop>
);

export default HomeBackdrop;
