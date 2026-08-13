import EmptyState from '@/shared/components/ui/EmptyState';
import Searchbar from '@/shared/components/Searchbar';
import { useEffect, useState } from 'react';
import {
  useSearchUsersQuery,
  useSendFriendRequestMutation,
} from '@/features/chat/hooks';
import FriendSuggestionListItem from '@/shared/components/ui/FriendSuggestionListItem';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import AvatarSkeleton from '@/shared/components/skeletons/AvatarSkeleton';
import type { User } from '@/shared/types';

type SearchUserRow = User & {
  isRequested?: boolean;
};

type SearchUsersResponse = {
  data?: SearchUserRow[];
};

const SEARCH_DEBOUNCE_MS = 450;

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
    } catch (error) {
      console.error('Error adding friend:', error);
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
      <div className="shrink-0 px-1">
        <Searchbar
          searchText={searchText}
          setSearchText={setSearchText}
          expandable={false}
          variant="line"
          autoFocus
          placeholder="Search people by name…"
          className="w-full"
        />
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        {hasQuery || users.length > 0 ? (
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-body-300">
              {hasQuery ? 'Results' : 'Suggested'}
            </p>
            {isUpdating ? (
              <span className="text-xs text-body-300">Updating…</span>
            ) : null}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
          {showInitialSkeletons ? (
            <div className="space-y-1 px-1">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <AvatarSkeleton
                    key={i}
                    className="h-16 rounded-lg bg-transparent px-2"
                  />
                ))}
            </div>
          ) : showEmpty ? (
            <EmptyState
              className="h-full min-h-[16rem]"
              imageSrc="/images/no-member.svg"
              imageAlt="no member"
              imageClassName="w-40 opacity-40 sm:w-48"
              titleClassName="mt-3 max-w-[16rem] text-center text-base font-medium text-body-300"
              title={isError ? 'Search failed — try again' : 'No one found'}
            />
          ) : showIdleEmpty ? (
            <EmptyState
              className="h-full min-h-[16rem]"
              imageSrc="/images/no-member.svg"
              imageAlt="search people"
              imageClassName="w-44 opacity-45 sm:w-52"
              titleClassName="mt-3 max-w-[15rem] text-center text-base font-medium leading-snug text-body-300"
              title="Search to find people to add"
            />
          ) : (
            <div
              className={`flex flex-col gap-0.5 px-1 transition-opacity duration-150 ${
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
