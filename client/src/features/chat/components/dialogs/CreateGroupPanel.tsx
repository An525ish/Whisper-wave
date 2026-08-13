import EmptyState from '@/shared/components/ui/EmptyState';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useCreateGroupMutation, useMyFriendsQuery } from '@/features/chat/hooks';
import Searchbar from '@/shared/components/Searchbar';
import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
} from 'react';
import toast from 'react-hot-toast';
import SuggestionListItem from '@/shared/components/ui/SuggestionListItem';
import { useNavigate } from 'react-router-dom';
import AvatarSkeleton from '@/shared/components/skeletons/AvatarSkeleton';
import defaultAvatar from '@/assets/avatar.png';
import type { User } from '@/shared/types';

type FriendsResponse = {
  data?: User[];
};

type CreateGroupResult = {
  _id?: string;
};

type CreateGroupPanelProps = {
  onCreated?: () => void;
};

/** Create-group body — used inside NewConnectDialog tabs. */
const CreateGroupPanel = ({ onCreated }: CreateGroupPanelProps) => {
  const [searchText, setSearchText] = useState('');
  const [groupname, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [nameFocused, setNameFocused] = useState(false);
  const inputId = useId();

  const navigate = useNavigate();
  const { data: friends, isLoading, error } = useMyFriendsQuery({});
  const [createGroup, { isLoading: isCreateGroupLoading }] = useAsyncMutation(
    useCreateGroupMutation,
  );

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleSelectMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((el) => el !== id) : [...prev, id],
    );
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async () => {
    if (!groupname.trim()) return toast.error('Please add a group name');
    if (selectedMembers.length < 2)
      return toast.error('Select at least 2 members');

    const formData = new FormData();
    formData.append('name', groupname.trim());
    formData.append('members', JSON.stringify(selectedMembers));
    if (avatarFile) formData.append('avatar', avatarFile);

    const created = (await createGroup(
      'Creating your group...',
      formData,
    )) as CreateGroupResult | null;

    const chatId = created?._id;
    onCreated?.();

    if (!chatId) {
      toast.error('Group created, but could not open the chat');
      return;
    }

    navigate(`/chat/${chatId}`);
  };

  if (error) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong';
    return (
      <div className="rounded-xl bg-red-dark/40 p-4 text-sm text-red">
        {message}
      </div>
    );
  }

  const friendsData = (friends as FriendsResponse | undefined)?.data || [];
  const filteredMembers = friendsData.filter((friend) =>
    friend.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const canCreate =
    groupname.trim().length > 0 && selectedMembers.length >= 2;

  const initial = groupname.trim().charAt(0).toUpperCase();
  const showInitial = !avatarPreview && Boolean(initial);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Identity — avatar + name */}
      <div className="shrink-0 px-1 pb-5">
        <div className="flex items-center gap-4">
          <label
            htmlFor={inputId}
            className="group relative shrink-0 cursor-pointer"
            title="Set group photo"
          >
            <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full ring-2 ring-border transition group-hover:ring-green/50 sm:h-20 sm:w-20">
              {showInitial ? (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-green-dark to-primary text-2xl font-semibold text-green">
                  {initial}
                </div>
              ) : (
                <img
                  src={avatarPreview ?? defaultAvatar}
                  alt=""
                  className={`h-full w-full object-cover ${
                    avatarPreview ? '' : 'opacity-80'
                  }`}
                />
              )}
              <div className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/45">
                <span className="text-[10px] font-medium uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">
                  Edit
                </span>
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full border border-border bg-primary text-xs shadow-md">
              ✎
            </span>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
            />
          </label>

          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-body-300">
              Group name
            </p>
            <input
              className={`w-full border-b bg-transparent pb-2 text-lg font-medium outline-none transition placeholder:font-normal placeholder:text-body-300 ${
                nameFocused ? 'border-green/70' : 'border-border'
              }`}
              type="text"
              placeholder="Give it a name…"
              value={groupname}
              onChange={(e) => setGroupName(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              maxLength={60}
            />
          </div>
        </div>
      </div>

      <div className="shrink-0 px-1">
        <Searchbar
          searchText={searchText}
          setSearchText={setSearchText}
          expandable={false}
          variant="line"
          placeholder="Filter friends…"
          className="w-full"
        />
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-body-300">
            Add members
          </p>
          <span className="min-w-[6.5rem] text-right text-xs tabular-nums text-body-300">
            {selectedMembers.length > 0
              ? `${selectedMembers.length} selected`
              : 'At least 2'}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="space-y-1 px-1">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <AvatarSkeleton
                    key={i}
                    className="h-16 rounded-lg bg-transparent px-2"
                  />
                ))}
            </div>
          ) : friendsData.length === 0 ? (
            <EmptyState
              className="h-full min-h-[12rem]"
              imageSrc="/images/no-member.svg"
              imageAlt="no friends"
              imageClassName="mx-auto w-36 opacity-40 sm:w-44"
              titleClassName="mt-4 max-w-[16rem] text-center text-base font-medium text-body-300"
              title="Add friends first, then create a group"
            />
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              className="h-full min-h-[12rem]"
              imageSrc="/images/no-member.svg"
              imageAlt="no member"
              imageClassName="mx-auto w-36 opacity-40 sm:w-44"
              titleClassName="mt-4 max-w-[16rem] text-center text-base font-medium text-body-300"
              title="No friends match your search"
            />
          ) : (
            <div className="flex flex-col gap-0.5 px-1">
              {filteredMembers.map((friend) => (
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
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 pt-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canCreate || isCreateGroupLoading}
          className="h-12 w-full rounded-xl bg-gradient-green text-sm font-semibold text-white shadow-md transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCreateGroupLoading ? 'Creating…' : 'Create group'}
        </button>
      </div>
    </div>
  );
};

export default CreateGroupPanel;
