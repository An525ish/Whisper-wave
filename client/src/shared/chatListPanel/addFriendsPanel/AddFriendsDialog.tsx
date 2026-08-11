import DialogWrapper from '@/components/ui/DialogWrapper';
import EmptyState from '@/components/ui/EmptyState';
import Searchbar from '@/shared/Searchbar';
import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  useSearchUsersQuery,
  useSendFriendRequestMutation,
} from '@/features/api/hooks';
import FriendSuggestionListItem from '@/components/ui/FriendSuggestionListItem';
import useAsyncMutation from '@/hooks/asyncMutation';
import AvatarSkeleton from '@/components/skeletons/AvatarSkeleton';
import type { User } from '@/types';

type AddFriendsDialogProps = {
  isOpen: boolean;
  setIsClicked: Dispatch<SetStateAction<boolean>>;
};

type SearchUserRow = User & {
  isRequested?: boolean;
};

type SearchUsersResponse = {
  data?: SearchUserRow[];
};

const SEARCH_DEBOUNCE_MS = 450;

const AddFriendsDialog = ({ isOpen, setIsClicked }: AddFriendsDialogProps) => {
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

  return (
    <DialogWrapper isOpen={isOpen}>
      <div className="flex h-full min-h-0 flex-col p-4">
        <div className="flex shrink-0 justify-between">
          <span
            onClick={() => setIsClicked(false)}
            className="mr-4 inline-block rotate-180 cursor-pointer text-xl font-medium hover:text-red"
          >
            ↪
          </span>
          <p className="text-xl font-medium">Add New Friends</p>
          <span className="w-6" />
        </div>

        <div className="mt-6 flex shrink-0 items-center justify-between border py-2 full-border">
          <span className="text-body-700">Search For Members:</span>
          <Searchbar
            searchText={searchText}
            setSearchText={setSearchText}
            autoFocus={true}
          />
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
            <p className="font-medium text-body-300">Suggested</p>
            {isUpdating ? (
              <span className="text-xs text-body-300">Updating…</span>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto scrollbar-hide">
            {showInitialSkeletons ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <AvatarSkeleton
                    key={i}
                    className={'h-20 bg-transparent px-4 py-2'}
                  />
                ))
            ) : showEmpty ? (
              <EmptyState
                className="h-full"
                imageSrc="/images/no-member.svg"
                imageAlt="no member"
                imageClassName="w-60 opacity-50"
                titleClassName="mt-6 text-center text-xl font-semibold text-body-300"
                title={isError ? 'Search failed — try again' : 'No Member found'}
              />
            ) : users.length === 0 ? (
              <EmptyState
                className="h-full"
                imageSrc="/images/no-member.svg"
                imageAlt="search members"
                imageClassName="w-60 opacity-50"
                titleClassName="mt-6 text-center text-xl font-semibold text-body-300"
                title="Search to find people"
              />
            ) : (
              <div
                className={`flex flex-col gap-4 transition-opacity duration-150 ${
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
    </DialogWrapper>
  );
};

export default AddFriendsDialog;
