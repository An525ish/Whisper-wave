import { useGroupsPage } from '@/hooks/admin';
import {
  groupsEmptyDescription,
  groupsMatchesLabel,
  groupsMatchesValue,
} from '@/utils/admin/groups';
import GroupDetailPanel from './detail/GroupDetailPanel';
import GroupsDirectoryHeader from './feed/GroupsDirectoryHeader';
import GroupsFeed from './feed/GroupsFeed';
import GroupsHeader from './header/GroupsHeader';
import GroupsStats from './stats/GroupsStats';

const Groups = () => {
  const {
    scrollRef,
    searchText,
    setSearchText,
    querySearch,
    memberFilter,
    setMemberFilter,
    selectedGroup,
    setSelectedGroup,
    groups,
    matchTotal,
    platformTotal,
    newThisWeek,
    totalMembers,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
    isSearchPending,
    showMinSearchHint,
    sentinelEnabled,
  } = useGroupsPage();

  return (
    <div className="mx-auto flex h-[calc(100dvh-3rem)] max-h-[calc(100dvh-3rem)] min-h-0 w-full max-w-6xl flex-col gap-8 lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)]">
      <GroupsHeader searchText={searchText} setSearchText={setSearchText} />

      <GroupsStats
        platformTotal={platformTotal}
        matchesLabel={groupsMatchesLabel(querySearch, memberFilter)}
        matchesValue={groupsMatchesValue(querySearch, memberFilter, matchTotal, groups.length)}
        totalMembers={totalMembers}
        newThisWeek={newThisWeek}
      />

      <section className="flex min-h-0 flex-1 flex-col">
        <GroupsDirectoryHeader
          memberFilter={memberFilter}
          onMemberFilterChange={setMemberFilter}
          querySearch={querySearch}
          searchText={searchText}
          showMinSearchHint={showMinSearchHint}
          onClearSearch={() => setSearchText('')}
        />

        <GroupsFeed
          scrollRef={scrollRef}
          groups={groups}
          isLoading={isLoading}
          isSearchPending={isSearchPending}
          isError={isError}
          emptyDescription={groupsEmptyDescription(memberFilter, querySearch)}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          sentinelEnabled={sentinelEnabled}
          onOpenGroup={setSelectedGroup}
          onLoadMore={() => void fetchNextPage()}
          onRetry={() => void refetch()}
        />
      </section>

      {selectedGroup && (
        <GroupDetailPanel
          key={selectedGroup._id}
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
};

export default Groups;
