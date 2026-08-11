import DialogWrapper from '@/components/ui/DialogWrapper';
import EmptyState from '@/components/ui/EmptyState';
import useAsyncMutation from '@/hooks/asyncMutation';
import { useCreateGroupMutation, useMyFriendsQuery } from '@/features/api/hooks';
import Searchbar from '@/shared/Searchbar';
import { useState, type Dispatch, type SetStateAction } from 'react';
import toast from 'react-hot-toast';
import SuggestionListItem from '@/components/ui/SuggestionListItem';
import { useNavigate } from 'react-router-dom';
import AvatarSkeleton from '@/components/skeletons/AvatarSkeleton';
import type { User } from '@/types';

type GroupChatDialogProps = {
  isCreateGroup: boolean;
  setIsCreateGroup: Dispatch<SetStateAction<boolean>>;
};

type FriendsResponse = {
  data?: User[];
};

type CreateGroupResult = {
  _id?: string;
};

const GroupChatDialog = ({
  isCreateGroup,
  setIsCreateGroup,
}: GroupChatDialogProps) => {
  const [searchText, setSearchText] = useState('');
  const [groupname, setGroupName] = useState('');

  const navigate = useNavigate();

  const { data: friends, isLoading, error } = useMyFriendsQuery({});
  const [createGroup, { isLoading: isCreateGroupLoading }] = useAsyncMutation(
    useCreateGroupMutation,
  );

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleSelectMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((el) => el !== id) : [...prev, id],
    );
  };

  const onSubmit = async () => {
    if (!groupname) return toast.error('Please add a group name');
    if (selectedMembers.length < 2)
      return toast.error('Select atleast 2 members');

    const created = (await createGroup('Creating your group...', {
      name: groupname,
      members: selectedMembers,
    })) as CreateGroupResult | null;

    const chatId = created?._id;
    if (!chatId) {
      toast.error('Group created, but could not open the chat');
      setIsCreateGroup(false);
      return;
    }

    setIsCreateGroup(false);
    navigate(`/chat/${chatId}`);
  };

  if (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    return <div>Error: {message}</div>;
  }

  const friendsData = (friends as FriendsResponse | undefined)?.data || [];
  const filteredMembers = friendsData.filter((friend) =>
    friend.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <DialogWrapper isOpen={isCreateGroup}>
      <div className="flex h-full min-h-0 flex-col p-4">
        <div className="flex shrink-0 items-center justify-between">
          <p className="text-xl font-medium">
            <span
              onClick={() => setIsCreateGroup(false)}
              className="mr-4 inline-block rotate-180 cursor-pointer"
            >
              ↪
            </span>
            New Group
          </p>
          <button
            type="button"
            className="rounded-2xl border border-green-light bg-transparent px-4 py-0.5 text-green transition-[background-color,border-color] duration-200 ease-out hover:border-green hover:bg-green-dark hover:[filter:none] active:opacity-90 active:[filter:none]"
            onClick={onSubmit}
            disabled={isCreateGroupLoading}
          >
            Create
          </button>
        </div>

        <div className="mt-3 shrink-0">
          <input
            className={
              'w-full rounded-3xl border-0 border-b bg-transparent bg-primary px-4 py-2 text-center text-lg outline-none border-border full-border'
            }
            type="text"
            autoFocus={true}
            placeholder="Type your Group Name..."
            value={groupname}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div className="flex shrink-0 items-center justify-between border py-2 full-border">
          <span className="text-body-700">Search For Members :</span>
          <Searchbar searchText={searchText} setSearchText={setSearchText} />
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <p className="mb-4 shrink-0 font-medium text-body-300">Suggested</p>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto scrollbar-hide">
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <AvatarSkeleton
                    key={i}
                    className={'h-20 bg-transparent px-4 py-2'}
                  />
                ))
            ) : filteredMembers.length === 0 ? (
              <EmptyState
                className="h-full"
                imageSrc="/images/no-member.svg"
                imageAlt="no member"
                imageClassName="w-60 opacity-50"
                titleClassName="mt-6 text-center text-xl font-semibold text-body-300"
                title="No Member found"
              />
            ) : (
              filteredMembers.map((friend) => (
                <SuggestionListItem
                  key={friend._id}
                  data={{
                    _id: friend._id,
                    name: friend.name,
                    avatar:
                      typeof friend.avatar === 'string'
                        ? friend.avatar
                        : (friend.avatar?.url ?? null),
                  }}
                  isSelected={selectedMembers.includes(friend._id)}
                  handleSelectMember={handleSelectMember}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </DialogWrapper>
  );
};

export default GroupChatDialog;
