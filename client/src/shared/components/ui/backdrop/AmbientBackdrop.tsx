import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import './ambientBackdrop.css';

type Props = {
  /** Surface-specific decorative layers, rendered between the glows and the grain. */
  children?: ReactNode;
  /** Tuning class that sets `--ab-*` custom properties (see ambientBackdrop.css). */
  className?: string;
  /** Teal glow (default on). */
  teal?: boolean;
  /** Faint green glow (default on). */
  green?: boolean;
};

/** Decorative page atmosphere: grid mesh, aurora glows, grain, vignette. */
const AmbientBackdrop = ({ children, className, teal = true, green = true }: Props) => (
  <div aria-hidden className={cn('ab-bg', className)}>
    <div className="ab-mesh" />
    <div className="ab-glow ab-glow--violet" />
    {teal && <div className="ab-glow ab-glow--teal" />}
    {green && <div className="ab-glow ab-glow--green" />}
    {children}
    <div className="ab-grain" />
    <div className="ab-vignette" />
  </div>
);

export default AmbientBackdrop;
