import EmptyState from '@/components/ui/EmptyState';
import useAsyncMutation from '@/hooks/shared/useAsyncMutation';
import { useCreateGroupMutation, useMyFriendsQuery } from '@/hooks/chat';
import Searchbar from '@/components/ui/Searchbar';
import PencilIcon from '@/components/ui/icons/Pencil';
import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
} from 'react';
import toast from 'react-hot-toast';
import SuggestionListItem from '@/components/chat/list/SuggestionListItem';
import { useNavigate } from 'react-router-dom';
import AvatarSkeleton from '@/components/ui/skeletons/AvatarSkeleton';
import defaultAvatar from '@/assets/avatar.png';
import type { FriendsResponse, CreateGroupResult } from '@/types/chat';

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
      <div className="rounded-2xl bg-red-dark/40 p-4 text-sm text-red">
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
  const selectedCount = selectedMembers.length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 rounded-2xl bg-background-alt/55 p-3 ring-1 ring-border/45">
        <div className="flex items-center gap-3.5">
          <label
            htmlFor={inputId}
            className="group relative shrink-0 cursor-pointer"
            title="Set group photo"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-border transition group-hover:ring-green/50">
              {showInitial ? (
                <div className="grid h-full w-full place-items-center bg-linear-to-br from-green-dark to-primary text-xl font-semibold text-green">
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
              <div className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/45" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full bg-green text-background shadow-md ring-2 ring-background">
              <PencilIcon className="h-3 w-3" />
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
              className={`w-full border-b bg-transparent pb-1.5 text-base font-medium outline-none transition placeholder:font-normal placeholder:text-white/25 ${
                nameFocused ? 'border-green/70' : 'border-border/80'
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

      <div className="mt-3 shrink-0">
        <Searchbar
          searchText={searchText}
          setSearchText={setSearchText}
          expandable={false}
          variant="pill"
          placeholder="Filter friends…"
          className="w-full"
        />
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-body-300">
            Add members
          </p>
          <span
            className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold tabular-nums ring-1 ring-inset ${
              selectedCount >= 2
                ? 'bg-green/15 text-green ring-green/25'
                : 'bg-white/6 text-body-300 ring-white/10'
            }`}
          >
            {selectedCount > 0 ? `${selectedCount} selected` : 'At least 2'}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
          {isLoading ? (
            <div className="space-y-1">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <AvatarSkeleton
                    key={i}
                    className="h-16 rounded-2xl bg-transparent px-2"
                  />
                ))}
            </div>
          ) : friendsData.length === 0 ? (
            <EmptyState
              className="h-full min-h-48"
              imageSrc="/images/no-member.svg"
              imageAlt="no friends"
              imageClassName="mx-auto w-36 opacity-40 sm:w-44"
              titleClassName="mt-4 max-w-64 text-center text-base font-medium text-body-300"
              title="Add friends first, then create a group"
            />
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              className="h-full min-h-48"
              imageSrc="/images/no-member.svg"
              imageAlt="no member"
              imageClassName="mx-auto w-36 opacity-40 sm:w-44"
              titleClassName="mt-4 max-w-64 text-center text-base font-medium text-body-300"
              title="No friends match your search"
            />
          ) : (
            <div className="flex flex-col gap-1">
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

      <div className="shrink-0 border-t border-border/50 pt-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canCreate || isCreateGroupLoading}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-green text-sm font-semibold text-white shadow-[0_10px_24px_rgba(1,195,109,0.28)] transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCreateGroupLoading ? 'Creating…' : 'Create group'}
        </button>
      </div>
    </div>
  );
};

export default CreateGroupPanel;
