import AmbientBackdrop from '@/shared/components/ui/backdrop/AmbientBackdrop';

/**
 * Full-page atmosphere for the hub home — the landing/auth treatment,
 * retuned to the home's midnight-shore palette.
 *
 * Layers (all decorative, `aria-hidden` by the caller):
 * shared ambient backdrop + signal bars.
 * Still under `prefers-reduced-motion` via home.css.
 */
const HomeBackdrop = () => (
  <AmbientBackdrop className="hw-bg">
    <div className="hw-signal">
      <span />
      <span />
      <span />
      <span />
    </div>
  </AmbientBackdrop>
);

export default HomeBackdrop;
