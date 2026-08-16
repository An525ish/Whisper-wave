import { useUsersPage } from '@/hooks/admin';
import {
  usersEmptyDescription,
  usersMatchesLabel,
  usersMatchesValue,
} from '@/utils/admin/users';
import UserDetailPanel from './detail/UserDetailPanel';
import UsersDirectoryHeader from './feed/UsersDirectoryHeader';
import UsersFeed from './feed/UsersFeed';
import UsersHeader from './header/UsersHeader';
import UsersStats from './stats/UsersStats';

const Users = () => {
  const {
    scrollRef,
    searchText,
    setSearchText,
    querySearch,
    selectedUserId,
    setSelectedUserId,
    users,
    matchTotal,
    platformTotal,
    newThisWeek,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
    isSearchPending,
    showMinSearchHint,
    sentinelEnabled,
  } = useUsersPage();

  return (
    <div className="mx-auto flex h-[calc(100dvh-3rem)] max-h-[calc(100dvh-3rem)] min-h-0 w-full max-w-6xl flex-col gap-8 lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)]">
      <UsersHeader searchText={searchText} setSearchText={setSearchText} />

      <UsersStats
        platformTotal={platformTotal}
        matchesLabel={usersMatchesLabel(querySearch)}
        matchesValue={usersMatchesValue(querySearch, matchTotal, users.length)}
        newThisWeek={newThisWeek}
      />

      <section className="flex min-h-0 flex-1 flex-col">
        <UsersDirectoryHeader
          querySearch={querySearch}
          searchText={searchText}
          showMinSearchHint={showMinSearchHint}
          onClearSearch={() => setSearchText('')}
        />

        <UsersFeed
          scrollRef={scrollRef}
          users={users}
          isLoading={isLoading}
          isSearchPending={isSearchPending}
          isError={isError}
          emptyDescription={usersEmptyDescription(querySearch)}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          sentinelEnabled={sentinelEnabled}
          onOpenUser={setSelectedUserId}
          onLoadMore={() => void fetchNextPage()}
          onRetry={() => void refetch()}
        />
      </section>

      {selectedUserId && (
        <UserDetailPanel
          key={selectedUserId}
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default Users;
