import type { Ref } from 'react';
import MemesIcon from '@/shared/components/ui/icons/Memes';
import MemeModeSwitch from './MemeModeSwitch';
import type { MemeCategory, MemeCategoryChip } from '../types';
import './memesHeader.css';
import './memesList.css';

type Props = {
  unfiltered: boolean;
  chips: MemeCategoryChip[];
  category: MemeCategory;
  onSelect: (category: MemeCategory) => void;
  topRef: Ref<HTMLElement>;
  barRef: Ref<HTMLSpanElement>;
};

/** Sticky glass header: title, the 18+ switch, shelf chips and the scroll hairline. */
const MemeFeedHeader = ({ unfiltered, chips, category, onSelect, topRef, barRef }: Props) => (
  <header ref={topRef} className="mm-top">
    <div aria-hidden className="mm-top__wash" />
    <div className="mm-top__head">
      <div className="mm-top__title">
        <span aria-hidden className="mm-badge">
          <MemesIcon />
        </span>
        <div>
          <h1 className="mm-toptitle">
            Jokes on <span className="mm-iri">shuffle.</span>
          </h1>
          <p className={`mm-eyebrow${unfiltered ? ' mm-eyebrow--raw' : ''}`}>
            <span aria-hidden className="mm-eyebrow__dot" />
            {unfiltered ? 'Unfiltered' : 'Safe mode'}
          </p>
        </div>
      </div>
      <MemeModeSwitch />
    </div>
    <div role="group" aria-label="Joke shelves" className="mm-chips">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          aria-pressed={chip.id === category}
          onClick={() => onSelect(chip.id)}
          className={`mm-shelf${chip.id === category ? ' mm-shelf--on' : ''}`}
        >
          {chip.label}
        </button>
      ))}
    </div>
    <div aria-hidden className="mm-progress">
      <span ref={barRef} />
    </div>
  </header>
);

export default MemeFeedHeader;
