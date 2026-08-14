import DialogWrapper from '@/components/ui/DialogWrapper';
import BottomSheet from '@/components/ui/BottomSheet';
import ChevronLeft from '@/components/ui/icons/ChevronLeft';
import AddMemberIcon from '@/components/ui/icons/AddMember';
import CreateGroupIcon from '@/components/ui/icons/CreateGroup';
import Tabs from '@/components/ui/swipeable-tabs/Tab';
import { useEffect, useState } from 'react';
import AddFriendsPanel from '@/components/chat/dialogs/AddFriendsPanel';
import CreateGroupPanel from '@/components/chat/dialogs/CreateGroupPanel';
import { useMediaQuery } from '@/hooks/shared/useMediaQuery';
import type { NewConnectTab } from '@/types/chat';

export type { NewConnectTab };

type NewConnectDialogProps = {
  isOpen: boolean;
  initialTab?: NewConnectTab;
  onClose: () => void;
};

const TABS: {
  id: NewConnectTab;
  label: string;
  title: string;
  hint: string;
}[] = [
  {
    id: 'friends',
    label: 'Friends',
    title: 'Find people',
    hint: 'Search and send a friend request',
  },
  {
    id: 'group',
    label: 'Group',
    title: 'Build a group',
    hint: 'Add a name, photo, and members',
  },
];

/** Combined sheet — Add friends + Create group as tabs. */
const NewConnectDialog = ({
  isOpen,
  initialTab = 'friends',
  onClose,
}: NewConnectDialogProps) => {
  const [activeTab, setActiveTab] = useState<NewConnectTab>(initialTab);
  const isMobileSheet = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const active = TABS[activeIndex] ?? TABS[0];

  const body = (
    <>
      <header className="shrink-0 px-3 pb-4 pt-2 sm:px-5">
        <div className="mb-4 flex h-11 items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/12 bg-white/6 text-body transition hover:border-green/40 hover:bg-green/10 hover:text-green"
            aria-label="Close"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-0.5">
            <h2
              id="new-connect-title"
              key={active.id}
              className="truncate text-[15px] font-semibold leading-tight tracking-tight text-white"
            >
              {active.title}
            </h2>
            <p className="truncate text-xs leading-tight text-body-300">
              {active.hint}
            </p>
          </div>
        </div>

        <Tabs
          variant="pills"
          ariaLabel="Connect options"
          activeTabIndex={activeIndex}
          handleTabChange={(index) => {
            const next = TABS[index];
            if (next) setActiveTab(next.id);
          }}
          tabsData={TABS.map((tab) => ({
            id: tab.id,
            name: tab.label,
            icon:
              tab.id === 'friends' ? (
                <AddMemberIcon className="h-[1.15rem] w-[1.15rem] fill-current stroke-current" />
              ) : (
                <CreateGroupIcon className="h-[1.05rem] w-[1.05rem] fill-current stroke-current" />
              ),
          }))}
        />
      </header>

      <div className="mx-3 h-px shrink-0 bg-border/70 sm:mx-5" />

      <div className="min-h-0 flex-1 overflow-hidden px-3 py-4 sm:px-5">
        {activeTab === 'friends' ? (
          <AddFriendsPanel />
        ) : (
          <CreateGroupPanel onCreated={onClose} />
        )}
      </div>
    </>
  );

  if (isMobileSheet) {
    return (
      <BottomSheet
        open={isOpen}
        onClose={onClose}
        labelledBy="new-connect-title"
      >
        {body}
      </BottomSheet>
    );
  }

  return (
    <DialogWrapper isOpen={isOpen}>
      <div className="flex h-full min-h-0 flex-col">{body}</div>
    </DialogWrapper>
  );
};

export default NewConnectDialog;
