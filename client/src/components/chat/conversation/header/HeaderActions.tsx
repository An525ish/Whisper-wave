import PhoneCallIcon from '@/components/ui/icons/PhoneCall';
import ThreeDotsIcon from '@/components/ui/icons/ThreeDots';
import VideoCallIcon from '@/components/ui/icons/VideoCall';
import LeaveGroupIcon from '@/components/ui/icons/LeaveGroup';
import MembersIcon from '@/components/ui/icons/Members';
import SelectMessagesIcon from '@/components/ui/icons/SelectMessages';
import AccountBar from '@/components/profile/AccountBar';
import { type ReactNode, type RefObject } from 'react';
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

type MenuRowProps = {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'accent' | 'danger';
};

const chipTone = {
  default: 'bg-white/6 text-body-700 group-hover:bg-white/10 group-hover:text-body',
  accent: 'bg-green/15 text-green group-hover:bg-green/25',
  danger: 'bg-white/6 text-body-700 group-hover:bg-red/15 group-hover:text-red',
} as const;

const rowTone = {
  default: 'text-body-700 hover:bg-white/6 hover:text-body',
  accent: 'text-body hover:bg-green/10 hover:text-green',
  danger: 'text-body-700 hover:bg-red/10 hover:text-red',
} as const;

const MenuRow = ({
  label,
  icon,
  onClick,
  disabled,
  tone = 'default',
}: MenuRowProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition disabled:opacity-45 ${rowTone[tone]}`}
  >
    <span
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md transition ${chipTone[tone]}`}
    >
      {icon}
    </span>
    <span className={tone === 'accent' ? 'font-medium' : 'font-normal'}>
      {label}
    </span>
  </button>
);

const HeaderActions = ({
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
      className={`grid h-11 w-11 place-items-center rounded-full border text-body transition md:h-10 md:w-10 ${
        searchOpen || isDotsMenu
          ? 'border-green/50 bg-green/10 text-green'
          : 'border-white/15 group hover:border-green-light hover:text-white'
      }`}
      aria-label="Chat options"
      aria-expanded={isDotsMenu}
    >
      <ThreeDotsIcon className="h-4 w-4 fill-current transition group-hover:fill-green group-hover:text-green" />
    </button>

    {isDotsMenu ? (
      <div
        ref={menuRef}
        role="menu"
        className="absolute right-0 top-12 z-40 w-48 origin-top-right animate-menu-pop overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(165deg,rgba(48,38,60,0.97)_0%,rgba(28,22,38,0.98)_100%)] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(1,195,109,0.08)] backdrop-blur-xl md:right-2 md:top-14 motion-reduce:animate-none"
      >
        <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-green/35 to-transparent" />

        <MenuRow
          label="Search chat"
          tone="accent"
          onClick={onOpenSearch}
          icon={<img src={searchIcon} alt="" className="h-3.5 w-3.5" />}
        />

        <div className="mx-2 my-0.5 h-px bg-white/8" />

        <MenuRow
          label="Select messages"
          onClick={onToggleSelectMode}
          icon={<SelectMessagesIcon className="h-3.5 w-3.5" />}
        />

        {canClearChat ? (
          <MenuRow
            label="Clear chat"
            tone="danger"
            onClick={onClearChat}
            icon={<img src="/icons/clear.svg" alt="" className="h-3.5 w-3.5" />}
          />
        ) : null}

        {groupChat ? (
          <>
            <div className="mx-2 my-0.5 h-px bg-white/8" />
            <MenuRow
              label="Members"
              onClick={onAddMember}
              icon={<MembersIcon className="h-3.5 w-3.5" />}
            />
            <MenuRow
              label="Leave group"
              tone="danger"
              onClick={onLeaveGroup}
              disabled={isLeaveGroupLoading}
              icon={<LeaveGroupIcon className="h-3 w-3" />}
            />
          </>
        ) : null}
      </div>
    ) : null}
  </>
);

export default HeaderActions;
