import { useState } from 'react';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import AnonProfilePanel from './AnonProfilePanel';
import { useAnonIdentity } from '../hooks/useAnonIdentity';
import { useThreadStats } from '../hooks/useThreadStats';
import { useAnonStore } from '../stores/anonStore';

/**
 * Owns the identity panel's data and its two presentations.
 *
 * A column at `lg`, a bottom sheet below that — the same split the logged-in app
 * uses for `ProfilePanel` / `ProfileSheet`, so there is one spatial grammar
 * across the product. The `useMediaQuery` split mirrors `pages/Chat.tsx`.
 *
 * Keeping the data here means `AnonChatRoom` only has to decide *where* the
 * panel goes, not what it contains.
 */
export default function AnonProfileHost() {
  const [open, setOpen] = useState(false);
  const wide = useMediaQuery('(min-width: 1024px)');

  const identity = useAnonIdentity();
  const status = useAnonStore((s) => s.status);

  const inThread = status === 'matched';
  const stats = useThreadStats(identity.vibeTags, inThread || status === 'partner_left');

  const panel = (
    <AnonProfilePanel
      variant={wide ? 'column' : 'sheet'}
      displayName={identity.displayName}
      vibeTags={identity.vibeTags}
      gender={identity.gender}
      remember={identity.remember}
      justSaved={identity.justSaved}
      stats={stats}
      inThread={inThread}
      onAliasChange={identity.setAlias}
      onTagsChange={identity.setTags}
      onGenderChange={identity.setGender}
      onRememberChange={identity.setRemember}
    />
  );

  // Growing past the breakpoint with the sheet open would leave an orphaned
  // overlay on top of the column — and re-opening it when the viewport shrinks
  // again. Adjusted during render rather than in an effect, which is React's
  // documented pattern for reacting to a changed input.
  const [wasWide, setWasWide] = useState(wide);
  if (wasWide !== wide) {
    setWasWide(wide);
    if (wide) setOpen(false);
  }

  if (wide) {
    return (
      <aside className="acr-profile" aria-label="Your anonymous profile">
        {panel}
      </aside>
    );
  }

  return (
    <>
      <button
        type="button"
        className="acr-profile-fab"
        onClick={() => setOpen(true)}
        aria-label="Edit your anonymous profile"
      >
        <span
          className="acr-profile-fab__orb"
          style={{ background: 'linear-gradient(140deg, var(--color-void), var(--color-void-bright))' }}
          aria-hidden
        >
          {identity.displayName.trim().charAt(0).toUpperCase() || '?'}
        </span>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} labelledBy="acp-sheet-title">
        <h2 id="acp-sheet-title" className="sr-only">
          Your anonymous profile
        </h2>
        {panel}
      </BottomSheet>
    </>
  );
}