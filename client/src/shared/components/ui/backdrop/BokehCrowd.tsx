import type { CSSProperties } from 'react';
import './bokehCrowd.css';

type Mote = { left: string; size: string; dur: string; delay: string; tone: 'v' | 't' | 'g' };

/** Violet/teal/green fireflies, slow rise. Fixed layout so it never reflows. */
const MOTES: Mote[] = [
  { left: '4%', size: '22px', dur: '24s', delay: '0s', tone: 'v' },
  { left: '12%', size: '12px', dur: '18s', delay: '-6s', tone: 't' },
  { left: '21%', size: '16px', dur: '21s', delay: '-12s', tone: 'g' },
  { left: '30%', size: '10px', dur: '17s', delay: '-3s', tone: 'v' },
  { left: '39%', size: '26px', dur: '27s', delay: '-9s', tone: 't' },
  { left: '47%', size: '13px', dur: '19s', delay: '-15s', tone: 'g' },
  { left: '55%', size: '18px', dur: '23s', delay: '-7s', tone: 'v' },
  { left: '63%', size: '11px', dur: '16s', delay: '-11s', tone: 't' },
  { left: '71%', size: '24px', dur: '25s', delay: '-4s', tone: 'g' },
  { left: '79%', size: '14px', dur: '20s', delay: '-14s', tone: 'v' },
  { left: '87%', size: '19px', dur: '22s', delay: '-8s', tone: 't' },
  { left: '94%', size: '12px', dur: '18s', delay: '-2s', tone: 'g' },
];

/** Soft glowing dots drifting up behind a page. Render inside `AmbientBackdrop`. Decorative only. */
const BokehCrowd = () => (
  <div className="bk-crowd">
    {MOTES.map((m, i) => (
      <span
        key={i}
        className={`bk-mote bk-mote--${m.tone}`}
        style={{ '--bk-x': m.left, '--bk-size': m.size, '--bk-dur': m.dur, '--bk-delay': m.delay } as CSSProperties}
      />
    ))}
  </div>
);

export default BokehCrowd;
