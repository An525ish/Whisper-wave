import DialogWrapper from '@/shared/components/ui/DialogWrapper';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import ChevronLeft from '@/shared/components/ui/icons/ChevronLeft';
import AddMemberIcon from '@/shared/components/ui/icons/AddMember';
import CreateGroupIcon from '@/shared/components/ui/icons/CreateGroup';
import Tabs from '@/shared/components/ui/swipeable-tabs/Tab';
import { useState } from 'react';
import { NEW_CONNECT_TABS as TABS } from '../../constants/chat';
import AddFriendsPanel from './AddFriendsPanel';
import CreateGroupPanel from './CreateGroupPanel';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import type { NewConnectTab } from '../../types/chat';


type Props = {
  isOpen: boolean;
  initialTab?: NewConnectTab;
  onClose: () => void;
};

/** Combined sheet — Add friends + Create group as tabs. */
const NewConnectDialog = ({
  isOpen,
  initialTab = 'friends',
  onClose,
}: Props) => {
  const [activeTab, setActiveTab] = useState<NewConnectTab>(initialTab);
  const isMobileSheet = useMediaQuery('(max-width: 767px)');

  const [synced, setSynced] = useState({ isOpen, initialTab });
  if (synced.isOpen !== isOpen || synced.initialTab !== initialTab) {
    setSynced({ isOpen, initialTab });
    if (isOpen) setActiveTab(initialTab);
  }

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
