import type { Dispatch, SetStateAction } from 'react';
import Searchbar from '@/components/ui/Searchbar';

type GroupsHeaderProps = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
};

const GroupsHeader = ({ searchText, setSearchText }: GroupsHeaderProps) => (
  <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
      <h1 className="mt-1 font-display text-3xl leading-none tracking-tight text-body sm:text-4xl">
        Groups
      </h1>
      <p className="mt-2 text-sm text-body-300">
        Browse group chats, members, and ownership
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

export default GroupsHeader;
