import type { Dispatch, SetStateAction } from 'react';
import Searchbar from '@/components/ui/Searchbar';

type UsersHeaderProps = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
};

const UsersHeader = ({ searchText, setSearchText }: UsersHeaderProps) => (
  <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
      <h1 className="mt-1 font-display text-3xl leading-none tracking-tight text-body sm:text-4xl">
        Users
      </h1>
      <p className="mt-2 text-sm text-body-300">Browse accounts and open profiles for full details</p>
    </div>
    <Searchbar
      className="w-full sm:w-72"
      searchText={searchText}
      setSearchText={setSearchText}
      expandable={false}
    />
  </header>
);

export default UsersHeader;
