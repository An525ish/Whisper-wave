import type { KeyboardEvent } from 'react';
import { PROFILE_PANEL_ID, PROFILE_TAB_IDS } from '../constants';
import type { ProfileTab } from '../types';
import './anonPartnerPanel.css';

type Props = {
  tab: ProfileTab;
  partnerName: string;
  /** `sheet` sits inside the bottom sheet, which needs its own side inset. */
  variant: 'column' | 'sheet';
  onChange: (tab: ProfileTab) => void;
};

/**
 * Small "You | Them" switch for the profile rail. In the rail it sits in the slot
 * where the logged-in app shows its account bar, above the panel.
 *
 * A real tablist (roving tabindex, arrow keys) because it swaps one panel for
 * another; two buttons that merely look like tabs would not announce as such.
 */
export default function AnonProfileTabs({ tab, partnerName, variant, onChange }: Props) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    onChange(tab === 'them' ? 'you' : 'them');
    document.getElementById(PROFILE_TAB_IDS[tab === 'them' ? 'you' : 'them'])?.focus();
  };

  return (
    <div
      className={`apn-tabs${variant === 'sheet' ? ' apn-tabs--sheet' : ''}`}
      role="tablist"
      aria-label="Profiles"
      onKeyDown={handleKeyDown}
    >
      <span className={`apn-tabs__thumb apn-tabs__thumb--${tab}`} aria-hidden />
      {(['you', 'them'] as const).map((id) => (
        <button
          key={id}
          id={PROFILE_TAB_IDS[id]}
          type="button"
          role="tab"
          aria-selected={tab === id}
          aria-controls={PROFILE_PANEL_ID}
          tabIndex={tab === id ? 0 : -1}
          className={`apn-tabs__tab${tab === id ? ' apn-tabs__tab--on' : ''}`}
          onClick={() => onChange(id)}
        >
          <span className="apn-tabs__label">{id === 'them' ? partnerName : 'You'}</span>
        </button>
      ))}
    </div>
  );
}
