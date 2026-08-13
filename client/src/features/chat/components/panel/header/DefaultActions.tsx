import PhoneCallIcon from '@/shared/components/icons/PhoneCall';
import ThreeDotsIcon from '@/shared/components/icons/ThreeDots';
import VideoCallIcon from '@/shared/components/icons/VideoCall';
import LeaveGroupIcon from '@/shared/components/icons/LeaveGroup';
import MembersIcon from '@/shared/components/icons/Members';
import SelectMessagesIcon from '@/shared/components/icons/SelectMessages';
import AccountBar from '@/features/profile/components/AccountBar';
import { type RefObject } from 'react';
import searchIcon from '@/assets/search.svg';

type DefaultActionsProps = {
  isDotsMenu: boolean;
  searchOpen: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  groupChat?: boolean;
  canClearChat: boolean;
  isLeaveGroupLoading: boolean;
  onToggle: () => void;
  onOpenSearch: () => void;
  onToggleSelectMode?: () => void;
  onClearChat?: () => void;
  onAddMember: () => void;
  onLeaveGroup: () => void;
};

const DefaultActions = ({
  isDotsMenu,
  searchOpen,
  buttonRef,
  menuRef,
  groupChat,
  canClearChat,
  isLeaveGroupLoading,
  onToggle,
  onOpenSearch,
  onToggleSelectMode,
  onClearChat,
  onAddMember,
  onLeaveGroup,
}: DefaultActionsProps) => (
  <>
    <div className="md:hidden">
      <AccountBar variant="notification" overlayClassName="fixed inset-0 z-50" />
    </div>

    <button
      type="button"
      disabled
      className="hidden h-10 w-10 place-items-center rounded-full border border-border group hover:border-green-light md:grid"
      aria-label="Voice call (coming soon)"
    >
      <PhoneCallIcon className="h-5 w-5 transition group-hover:fill-green" />
    </button>
    <button
      type="button"
      disabled
      className="hidden h-10 w-10 place-items-center rounded-full border border-border group hover:border-green-light lg:grid"
      aria-label="Video call (coming soon)"
    >
      <VideoCallIcon className="h-5 w-5 transition group-hover:fill-green" />
    </button>

    <button
      type="button"
      ref={buttonRef}
      onClick={onToggle}
      className={`grid h-10 w-10 place-items-center rounded-full border bg-primary text-body transition ${
        searchOpen || isDotsMenu
          ? 'border-green/50 bg-green/10 text-green'
          : 'border-border hover:border-green-light hover:text-white active:bg-primary/70'
      }`}
      aria-label="Chat options"
      aria-expanded={isDotsMenu}
    >
      <ThreeDotsIcon className="h-4 w-4 fill-current stroke-current transition group-hover:fill-green group-hover:stroke-green" />
    </button>

    {isDotsMenu ? (
      <div
        ref={menuRef}
        className="absolute right-0 top-12 z-60 w-max min-w-52 origin-top-right overflow-hidden rounded-xl border border-border/70 bg-primary py-1 shadow-lg ring-1 ring-black/5 md:right-2"
      >
        <button
          type="button"
          className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-sm text-body-300 transition hover:text-body"
          onClick={onOpenSearch}
        >
          <img src={searchIcon} alt="" className="h-4 w-4 shrink-0" />
          <span>Search chat</span>
        </button>

        <div className="my-0.5 h-px bg-border/70" />
        <button
          type="button"
          className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-sm text-body-300 transition hover:text-body"
          onClick={onToggleSelectMode}
        >
          <SelectMessagesIcon className="h-4 w-4 shrink-0" />
          Select messages
        </button>

        {canClearChat ? (
          <button
            type="button"
            className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-sm text-body-300 transition hover:text-red"
            onClick={onClearChat}
          >
            <img src="/icons/clear.svg" alt="" className="h-4 w-4 shrink-0" />
            Clear chat
          </button>
        ) : null}

        {groupChat ? (
          <>
            <div className="my-0.5 h-px bg-border/70" />
            <button
              type="button"
              className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-sm text-body-300 transition hover:text-body"
              onClick={onAddMember}
            >
              <MembersIcon className="h-4 w-4 shrink-0" />
              Members
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-sm text-body-300 transition hover:text-body"
              onClick={onLeaveGroup}
              disabled={isLeaveGroupLoading}
            >
              <LeaveGroupIcon className="h-4 w-4 shrink-0" />
              Leave group
            </button>
          </>
        ) : null}
      </div>
    ) : null}
  </>
);

export default DefaultActions;
