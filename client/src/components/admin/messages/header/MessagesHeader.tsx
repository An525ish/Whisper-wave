import type { Dispatch, SetStateAction } from 'react';
import Searchbar from '@/components/ui/Searchbar';

type MessagesHeaderProps = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
};

const MessagesHeader = ({ searchText, setSearchText }: MessagesHeaderProps) => (
  <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
      <h1 className="mt-1 font-display text-3xl leading-none tracking-tight text-body sm:text-4xl">
        Messages
      </h1>
      <p className="mt-2 text-sm text-body-300">
        Review recent traffic, delivery status, and moderation actions
      </p>
    </div>
    <Searchbar
      className="w-full sm:w-72"
      searchText={searchText}
      setSearchText={setSearchText}
      expandable={false}
    />
  </header>
);

export default MessagesHeader;
