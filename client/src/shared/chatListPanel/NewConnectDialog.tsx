import DialogWrapper from '@/components/ui/DialogWrapper';
import ChevronLeft from '@/components/icons/ChevronLeft';
import AddMemberIcon from '@/components/icons/AddMember';
import CreateGroupIcon from '@/components/icons/CreateGroup';
import { useEffect, useState } from 'react';
import AddFriendsPanel from './addFriendsPanel/AddFriendsPanel';
import CreateGroupPanel from './createGroupPanel/CreateGroupPanel';

export type NewConnectTab = 'friends' | 'group';

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

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const active = TABS[activeIndex] ?? TABS[0];

  return (
    <DialogWrapper isOpen={isOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 px-3 pb-4 pt-2 sm:px-5">
          <div className="mb-4 flex items-start gap-1">
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:bg-primary/70"
              aria-label="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 pt-1.5">
              <h2
                key={active.id}
                className="truncate text-[1.35rem] font-semibold leading-tight tracking-tight text-white"
              >
                {active.title}
              </h2>
              <p className="mt-1 text-sm leading-snug text-body-300">
                {active.hint}
              </p>
            </div>
          </div>

          <div
            className="relative grid grid-cols-2 rounded-2xl border border-border/80 bg-background-alt/80 p-1"
            role="tablist"
            aria-label="Connect options"
          >
            <span
              className="pointer-events-none absolute top-1 bottom-1 rounded-xl border border-border bg-primary shadow-[inset_0_1px_0_rgba(235,236,236,0.06)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                left: `calc(${activeIndex} * 50% + 0.25rem)`,
                width: 'calc(50% - 0.5rem)',
              }}
              aria-hidden
            />
            {TABS.map((tab) => {
              const selected = activeTab === tab.id;
              const isFriends = tab.id === 'friends';
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 flex items-center justify-center gap-2.5 rounded-xl py-2.5 text-sm font-medium transition-colors duration-200 ${
                    selected ? 'text-white' : 'text-body-300 hover:text-body-700'
                  }`}
                >
                  {isFriends ? (
                    <AddMemberIcon
                      className={`h-[1.15rem] w-[1.15rem] transition ${
                        selected
                          ? 'fill-green stroke-green'
                          : 'fill-body-300 stroke-body-300'
                      }`}
                    />
                  ) : (
                    <CreateGroupIcon
                      className={`h-[1.05rem] w-[1.05rem] transition ${
                        selected
                          ? 'fill-green stroke-green'
                          : 'fill-body-300 stroke-body-300'
                      }`}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        <div className="mx-3 h-px shrink-0 bg-border/70 sm:mx-5" />

        <div className="min-h-0 flex-1 overflow-hidden px-3 py-4 sm:px-5">
          {activeTab === 'friends' ? (
            <AddFriendsPanel />
          ) : (
            <CreateGroupPanel onCreated={onClose} />
          )}
        </div>
      </div>
    </DialogWrapper>
  );
};

export default NewConnectDialog;
