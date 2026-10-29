import type { Dispatch, SetStateAction } from 'react';
import RefreshButton from '../../shared/RefreshButton';
import Searchbar from '@/shared/components/ui/Searchbar';

type Props = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
};

const MessagesHeader = ({ searchText, setSearchText }: Props) => (
  <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
      <h1 className="mt-1 font-semibold text-3xl leading-none tracking-tight text-body sm:text-4xl">
        Messages
      </h1>
      <p className="mt-2 text-sm text-body-300">
        Review recent traffic, delivery status, and moderation actions
      </p>
    </div>
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <Searchbar
        className="w-full sm:w-72"
        searchText={searchText}
        setSearchText={setSearchText}
        expandable={false}
      />
      <RefreshButton />
    </div>
  </header>
);

export default MessagesHeader;
