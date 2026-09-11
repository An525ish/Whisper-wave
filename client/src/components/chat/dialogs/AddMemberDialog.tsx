import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import SuggestionListItem from '@/components/chat/list/SuggestionListItem';
import AvatarCard from '@/components/ui/AvatarCard';
import ContextMenu from '@/components/ui/context-menu/ContextMenu';
import AvatarSkeleton from '@/components/ui/skeletons/AvatarSkeleton';
import ChevronLeft from '@/components/ui/icons/ChevronLeft';
import CountBadge from '@/components/ui/CountBadge';
import useAddMember from '@/hooks/chat/useAddMember';
import { useDragToClose, useLongPress } from '@/hooks/shared';
import type { GroupMember } from '@/hooks/chat/useAddMember';

const SearchGlyph = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="m16.2 16.2 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const AddPersonGlyph = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

type AddMemberDialogProps = {
  isMemberDialog: boolean;
  setIsMemberDialog: Dispatch<SetStateAction<boolean>>;
};

const AddMemberDialog = ({
  isMemberDialog,
  setIsMemberDialog,
}: AddMemberDialogProps) => {
  const [entered, setEntered] = useState(false);
  const close = () => setIsMemberDialog(false);
  const { sheetRef, handleRef, dragHandlers } = useDragToClose({ onClose: close });

  const {
    searchText,
    setSearchText,
    selectedMembers,
    isAddMember,
    contextTargetId,
    menuState,
    members,
    canManageMembers,
    NonGroupMembersData,
    isAvailableMembersLoading,
    isLoading,
    filteredMembers,
    filteredNonGroupMembers,
    handleSelectMember,
    addMemberHandler,
    closeContextMenu,
    handleContextMenu,
    onSubmit,
  } = useAddMember(() => setIsMemberDialog(false));

  // Slide-in animation trigger
  useEffect(() => {
    if (!isMemberDialog) { setEntered(false); return; }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [isMemberDialog]);

  // Esc to close
  useEffect(() => {
    if (!isMemberDialog) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isMemberDialog, setIsMemberDialog]);

  const bindLongPress = useLongPress<GroupMember>((member, { clientX, clientY }) => {
    handleContextMenu(
      { preventDefault: () => {}, stopPropagation: () => {}, clientX, clientY } as React.MouseEvent<HTMLElement>,
      member,
    );
  });

  const selectedCount = selectedMembers.length;

  return (
    <div className="absolute inset-0 z-40">
      {/* Backdrop — only visible on mobile below the header */}
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 sm:hidden ${
          entered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />

      {/* Slide-up sheet */}
      <div
        ref={sheetRef}
        className={`absolute inset-x-0 bottom-0 top-16 flex flex-col overflow-hidden rounded-tl-2xl rounded-tr-2xl border border-border/70 bg-background/95 backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:top-0 sm:rounded-tl-none sm:rounded-tr-none md:rounded-xl ${
          entered ? 'translate-y-0' : 'translate-y-full sm:translate-y-6'
        }`}
        {...dragHandlers}
      >
        {/* Green header glow */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)]" />

        {/* Drag handle — mobile only */}
        <div ref={handleRef} className="mx-auto mt-2.5 h-1 w-10 shrink-0 cursor-grab rounded-full bg-border/80 active:cursor-grabbing sm:hidden" />

        {/* ── Header ── */}
        <header className="relative shrink-0 px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={close}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/6 text-body transition hover:border-green/40 hover:bg-green/10 hover:text-green"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {isAddMember ? 'Add Members' : 'Group Members'}
                </h2>
                {!isAddMember && members.length > 0 ? (
                  <CountBadge count={members.length} />
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-body-300 sm:text-sm">
                {isAddMember
                  ? selectedCount > 0
                    ? `${selectedCount} selected`
                    : `${NonGroupMembersData.length} friend${NonGroupMembersData.length !== 1 ? 's' : ''} available`
                  : 'Long-press a member to manage'}
              </p>
            </div>

          </div>
        </header>

        <div className="mx-4 h-px shrink-0 bg-border/60 sm:mx-5" />

        {/* ── Search ── */}
        <div className="shrink-0 px-4 py-3 sm:px-5">
          <div className="group/search relative flex h-10 items-center gap-2.5 rounded-full border border-white/10 bg-black-light/35 px-3 transition focus-within:border-green/35 focus-within:bg-background/80 focus-within:shadow-[0_0_18px_rgba(1,195,109,0.08)]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-body-300 transition group-focus-within/search:text-green">
              <SearchGlyph />
            </span>
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={isAddMember ? 'Search friends…' : 'Search members…'}
              className="min-w-0 flex-1 border-0 bg-transparent py-0 text-sm text-body placeholder:text-body-300/80 outline-none [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />
          </div>
        </div>

        {/* ── Add Members CTA row (members tab only) ── */}
        {!isAddMember && canManageMembers ? (
          <div className="shrink-0 px-4 pb-2 sm:px-5">
            <button
              type="button"
              onClick={addMemberHandler}
              className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-left transition hover:border-green/40 hover:bg-green/5"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green/10 text-green transition group-hover:bg-green/20">
                <AddPersonGlyph />
              </div>
              <div>
                <p className="text-sm font-medium text-body">Add Members</p>
                <p className="text-xs text-body-300">Invite friends to this group</p>
              </div>
            </button>
          </div>
        ) : null}

        {/* ── List ── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-1 pb-2 scrollbar-hide sm:px-4">
          {isAddMember ? (
            <>
              {/* Selected chips */}
              {selectedCount > 0 ? (
                <div className="mb-2 flex flex-wrap gap-1.5 px-1 pt-1">
                  {selectedMembers.map((id) => {
                    const m = NonGroupMembersData.find((u) => u._id === id);
                    if (!m) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectMember(id)}
                        className="flex items-center gap-1.5 rounded-full border border-green/30 bg-green/10 px-2.5 py-0.5 text-xs font-medium text-green transition hover:bg-green/20"
                      >
                        {m.name}
                        <span className="text-[10px] opacity-70">✕</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {isAvailableMembersLoading ? (
                <div className="space-y-1">
                  {Array(5).fill(0).map((_, i) => (
                    <AvatarSkeleton key={i} className="h-16 rounded-2xl bg-transparent px-2" />
                  ))}
                </div>
              ) : filteredNonGroupMembers.length === 0 ? (
                <EmptyState
                  className="h-full min-h-48"
                  imageSrc="/images/no-member.svg"
                  imageAlt="no member"
                  imageClassName="mx-auto w-36 opacity-40 sm:w-44"
                  titleClassName="mt-4 max-w-64 text-center text-base font-medium text-body-300"
                  title="No Members Found"
                />
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredNonGroupMembers.map((member) => (
                    <SuggestionListItem
                      key={member._id}
                      data={{
                        _id: member._id,
                        name: member.name,
                        avatar:
                          typeof member.avatar === 'string'
                            ? member.avatar
                            : (member.avatar?.url ?? null),
                      }}
                      isSelected={selectedMembers.includes(member._id)}
                      handleSelectMember={handleSelectMember}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {filteredMembers.length === 0 ? (
                <EmptyState
                  className="h-full min-h-48"
                  imageSrc="/images/no-member.svg"
                  imageAlt="no member"
                  imageClassName="mx-auto w-36 opacity-40 sm:w-44"
                  titleClassName="mt-4 max-w-64 text-center text-base font-medium text-body-300"
                  title="No Members Found"
                />
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredMembers.map((member) => {
                    const { _id, name, avatar, isCreator, isAdmin } = member;
                    const isContextTarget = contextTargetId === _id;
                    return (
                      <div
                        key={_id}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 transition select-none [-webkit-touch-callout:none] ${
                          isContextTarget ? 'bg-gradient-row-hover-green' : 'hover:bg-gradient-row-hover'
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, member)}
                        {...bindLongPress(member)}
                      >
                        <AvatarCard avatars={[avatar]} avatarClassName="shadow-none" />
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-medium capitalize text-body">
                            {name}
                          </p>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {isCreator ? (
                              <span className="rounded-full border border-green/30 bg-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-green">
                                Creator
                              </span>
                            ) : isAdmin ? (
                              <span className="rounded-full border border-blue/40 bg-blue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-blue">
                                Admin
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Bottom CTA — add flow only ── */}
        {isAddMember ? (
          <div className="shrink-0 border-t border-border/50 bg-background/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            <button
              type="button"
              disabled={selectedCount === 0 || isLoading}
              onClick={() => { void onSubmit(); }}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-green text-sm font-semibold text-white shadow-[0_10px_24px_rgba(1,195,109,0.28)] transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : null}
              {isLoading ? 'Adding…' : selectedCount > 0 ? `Add ${selectedCount} member${selectedCount > 1 ? 's' : ''}` : 'Select members'}
            </button>
          </div>
        ) : null}

        <ContextMenu menuState={menuState} hideContextMenu={closeContextMenu} />
      </div>
    </div>
  );
};

export default AddMemberDialog;
