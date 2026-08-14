import EmptyState from '@/components/ui/EmptyState';
import Searchbar from '@/components/ui/Searchbar';
import CountBadge from '@/components/ui/CountBadge';
import { useEffect, useState } from 'react';
import {
  useSearchUsersQuery,
  useSendFriendRequestMutation,
} from '@/hooks/chat';
import FriendSuggestionListItem from '@/components/ui/FriendSuggestionListItem';
import useAsyncMutation from '@/hooks/shared/useAsyncMutation';
import AvatarSkeleton from '@/components/ui/skeletons/AvatarSkeleton';
import type { SearchUsersResponse } from '@/types/chat';
import { SEARCH_DEBOUNCE_MS } from '@/constants/chat';

/** Add-friends body — used inside NewConnectDialog tabs. */
const AddFriendsPanel = () => {
  const [searchText, setSearchText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [sendFriendRequest] = useAsyncMutation(useSendFriendRequestMutation);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchText.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const {
    data: searchResponse,
    isFetching,
    isPending,
    isError,
  } = useSearchUsersQuery(debouncedQuery);

  const users =
    (searchResponse as SearchUsersResponse | undefined)?.data ?? [];

  const handleAddFriend = async (receiverId: string) => {
    try {
      await sendFriendRequest('Sending Friend Request', { receiverId });
      setSentRequests((prev) => [...prev, receiverId]);
    } catch {
      setSentRequests((prev) => prev.filter((id) => id !== receiverId));
    }
  };

  const hasQuery = debouncedQuery.length > 0;
  const showInitialSkeletons = hasQuery && isPending && users.length === 0;
  const showEmpty =
    hasQuery && !isFetching && !isPending && (isError || users.length === 0);
  const isUpdating = hasQuery && isFetching && users.length > 0;
  const showIdleEmpty = !hasQuery && users.length === 0 && !showInitialSkeletons;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <Searchbar
          searchText={searchText}
          setSearchText={setSearchText}
          expandable={false}
          variant="pill"
          autoFocus
          placeholder="Search people by name…"
          className="w-full"
        />
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {hasQuery || users.length > 0 ? (
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-body-300">
              {hasQuery ? 'Results' : 'Suggested'}
            </p>
            {hasQuery && users.length > 0 ? (
              <CountBadge count={users.length} />
            ) : isUpdating ? (
              <span className="text-xs text-body-300">Updating…</span>
            ) : null}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
          {showInitialSkeletons ? (
            <div className="space-y-1">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <AvatarSkeleton
                    key={i}
                    className="h-16 rounded-2xl bg-transparent px-2"
                  />
                ))}
            </div>
          ) : showEmpty ? (
            <EmptyState
              className="h-full min-h-64"
              imageSrc="/images/no-member.svg"
              imageAlt="no member"
              imageClassName="w-40 opacity-40 sm:w-48"
              titleClassName="mt-3 max-w-64 text-center text-base font-medium text-body-300"
              title={isError ? 'Search failed — try again' : 'No one found'}
            />
          ) : showIdleEmpty ? (
            <EmptyState
              className="h-full min-h-64"
              imageSrc="/images/no-member.svg"
              imageAlt="search people"
              imageClassName="w-44 opacity-45 sm:w-52"
              titleClassName="mt-3 max-w-60 text-center text-base font-medium leading-snug text-body-300"
              title="Search to find people to add"
            />
          ) : (
            <div
              className={`flex flex-col gap-1 transition-opacity duration-150 ${
                isUpdating ? 'opacity-70' : 'opacity-100'
              }`}
            >
              {users.map((user) => (
                <FriendSuggestionListItem
                  key={user._id}
                  data={{
                    _id: user._id,
                    name: user.name,
                    avatar:
                      typeof user.avatar === 'string'
                        ? user.avatar
                        : (user.avatar?.url ?? null),
                    isRequested:
                      user.isRequested || sentRequests.includes(user._id),
                  }}
                  handleAddFriend={handleAddFriend}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendsPanel;
