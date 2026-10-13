import { useEffect, type ReactNode } from 'react';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import AnonPartnerPanel from './AnonPartnerPanel';
import AnonSelfPanel from './AnonSelfPanel';
import AnonProfileTabs from './AnonProfileTabs';
import { PROFILE_PANEL_ID, PROFILE_TAB_IDS } from '../constants';
import { useAnonIdentity } from '../hooks/useAnonIdentity';
import { usePartnerProfile } from '../hooks/usePartnerProfile';
import { useAnonStore } from '../stores/anonStore';
import { useProfileViewStore } from '../stores/profileViewStore';
import { avatarGradient } from '../utils/vibeTag';

type Props = {
  partnerTyping: boolean;
  partnerLeft: boolean;
  /** A spark was picked: put the text in the composer. */
  onPickSpark: (text: string) => void;
  /** The chat itself (`.acr-root`), which the shell places between the profiles. */
  children: ReactNode;
};

/**
 * The room's outer frame: the conversation, and where the two profiles sit beside it.
 *
 * - **Rail** (≥ 1024px): one right column laid out like the logged-in app's profile
 *   pane — a small You / Them switch in the header slot, then the panel. The chat
 *   takes two parts of the width and the rail one, as in the main app.
 * - **Sheet** (below): a bottom sheet, opened from the header (them) or the corner
 *   orb (you) — the same split the logged-in app uses for `ProfileSheet`.
 *
 * Wrapping the chat (rather than sitting beside it) keeps DOM order equal to visual
 * order, so keyboard and screen-reader order match what's on screen.
 */
export default function AnonProfileShell({
  partnerTyping,
  partnerLeft,
  onPickSpark,
  children,
}: Props) {
  const rail = useMediaQuery('(min-width: 1024px)');
  const tab = useProfileViewStore((s) => s.tab);
  const sheetOpen = useProfileViewStore((s) => s.sheetOpen);
  const setTab = useProfileViewStore((s) => s.setTab);
  const openSheet = useProfileViewStore((s) => s.openSheet);
  const closeSheet = useProfileViewStore((s) => s.closeSheet);

  const identity = useAnonIdentity();
  const partner = usePartnerProfile();
  const status = useAnonStore((s) => s.status);
  const inThread = status === 'matched';

  // Once the rail is showing, a sheet left "open" by a header tap would pop
  // up the moment the viewport narrows again. Syncing the store with an external
  // system (the media query) is what an effect is for.
  useEffect(() => {
    if (rail && sheetOpen) closeSheet();
  }, [rail, sheetOpen, closeSheet]);

  const variant = rail ? 'column' : 'sheet';

  const them = (
    <AnonPartnerPanel
      variant={variant}
      name={partner.name}
      tags={partner.tags}
      overlap={partner.overlap}
      sparks={partner.sparks}
      stats={partner.stats}
      links={partner.links}
      reactions={partner.reactions}
      typing={partnerTyping}
      left={partnerLeft}
      onPickSpark={onPickSpark}
    />
  );

  const you = (
    <AnonSelfPanel
      variant={variant}
      alias={partner.myName}
      aliasTags={partner.myTags}
      partnerName={partner.name}
      startedAt={partner.matchedAt}
      live={inThread}
      displayName={identity.displayName}
      vibeTags={identity.vibeTags}
      gender={identity.gender}
      remember={identity.remember}
      justSaved={identity.justSaved}
      onAliasChange={identity.setAlias}
      onTagsChange={identity.setTags}
      onGenderChange={identity.setGender}
      onRememberChange={identity.setRemember}
    />
  );

  const panel = (
    <div
      role="tabpanel"
      id={PROFILE_PANEL_ID}
      aria-labelledby={PROFILE_TAB_IDS[tab]}
      className="apn-panel"
    >
      {tab === 'them' ? them : you}
    </div>
  );

  if (rail) {
    return (
      <div className="acr-shell">
        {children}
        <aside className="acr-profile" aria-label="Profiles">
          <div className="acr-profile__head">
            <AnonProfileTabs tab={tab} partnerName={partner.name} variant="column" onChange={setTab} />
          </div>
          {panel}
        </aside>
      </div>
    );
  }

  return (
    <div className="acr-shell">
      {children}
      <button
        type="button"
        className="acr-profile-fab"
        onClick={() => openSheet('you')}
        aria-label="Edit your anonymous profile"
      >
        <span
          className="acr-profile-fab__orb"
          style={{ background: avatarGradient(identity.displayName) }}
          aria-hidden
        >
          {identity.displayName.trim().charAt(0).toUpperCase() || '?'}
        </span>
      </button>

      <BottomSheet open={sheetOpen} onClose={closeSheet} labelledBy="acp-sheet-title">
        <h2 id="acp-sheet-title" className="sr-only">
          Profiles
        </h2>
        <AnonProfileTabs tab={tab} partnerName={partner.name} variant="sheet" onChange={setTab} />
        {panel}
      </BottomSheet>
    </div>
  );
}
