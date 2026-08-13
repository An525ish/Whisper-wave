import {
  useEffect,
  useState,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from 'react';
import DialogWrapper from '@/shared/components/ui/DialogWrapper';
import EmptyState from '@/shared/components/ui/EmptyState';
import SuggestionListItem from '@/shared/components/ui/SuggestionListItem';
import Searchbar from '@/shared/components/Searchbar';
import AddMemberIcon from '@/shared/components/icons/AddMember';
import AvatarCard from '@/shared/components/ui/AvatarCard';
import useContextMenu from '@/shared/hooks/useContextMenu';
import ContextMenu from '@/shared/components/context-menu/ContextMenu';
import {
  useAddMemberMutation,
  useChatDetailsQuery,
  useMyFriendsQuery,
  useRemoveMemberMutation,
  useSetMemberAdminMutation,
} from '@/features/chat/hooks';
import { useParams } from 'react-router-dom';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import AvatarSkeleton from '@/shared/components/skeletons/AvatarSkeleton';
import type { User } from '@/shared/types';
import { useAuthStore } from '@/features/auth/store';

type GroupMember = {
  _id: string;
  name: string;
  avatar?: string;
  isCreator?: boolean;
  isAdmin?: boolean;
};

type AddMemberDialogProps = {
  isMemberDialog: boolean;
  setIsMemberDialog: Dispatch<SetStateAction<boolean>>;
};

type FriendsResponse = {
  data?: User[];
};

type ChatDetailsResponse = {
  data?: {
    members?: GroupMember[];
    myRole?: 'creator' | 'admin' | 'member' | null;
  };
};

const AddMemberDialog = ({
  isMemberDialog,
  setIsMemberDialog,
}: AddMemberDialogProps) => {
  const [searchText, setSearchText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isAddMember, setIsAddMember] = useState(false);
  const [contextTargetId, setContextTargetId] = useState<string | null>(null);
  const { menuState, showContextMenu, hideContextMenu } = useContextMenu();
  const selfId = useAuthStore((s) => s.user?._id);

  const handleSelectMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((el) => el !== id) : [...prev, id],
    );
  };

  const { chatId } = useParams();

  const { data: chatDetails } = useChatDetailsQuery({
    id: chatId,
    populate: true,
  });
  const chatData = (chatDetails as ChatDetailsResponse | undefined)?.data;
  const members = chatData?.members ?? [];
  const myRole = chatData?.myRole ?? null;
  const canManageMembers = myRole === 'creator' || myRole === 'admin';

  const { data: NonGroupMembers, isLoading: isAvailableMembersLoading } =
    useMyFriendsQuery({ chatId });
  const NonGroupMembersData =
    (NonGroupMembers as FriendsResponse | undefined)?.data || [];

  const [addMember, { isLoading }] = useAsyncMutation(useAddMemberMutation);
  const [removeMember] = useAsyncMutation(useRemoveMemberMutation);
  const [setMemberAdmin] = useAsyncMutation(useSetMemberAdminMutation);

  const onSubmit = async () => {
    await addMember('Adding member...', {
      chatId: chatId ?? '',
      members: selectedMembers,
    });
    setIsMemberDialog(false);
  };

  const addMemberHandler = () => {
    setIsAddMember(true);
  };

  const closeContextMenu = () => {
    hideContextMenu();
    setContextTargetId(null);
  };

  const handleContextMenu = (e: MouseEvent, member: GroupMember) => {
    e.preventDefault();
    e.stopPropagation();

    const memberId = String(member._id);
    const options: Array<{ id: number; icon: string; name: string }> = [];

    if (
      canManageMembers &&
      !member.isCreator &&
      memberId !== String(selfId ?? '') &&
      !(myRole === 'admin' && member.isAdmin)
    ) {
      options.push({
        id: 2,
        icon: '/icons/remove-user-icon.svg',
        name: 'Remove Member',
      });
    }

    if (myRole === 'creator' && !member.isCreator) {
      options.push({
        id: 3,
        icon: '/icons/remove-user-icon.svg',
        name: member.isAdmin ? 'Dismiss as admin' : 'Make group admin',
      });
    }

    if (options.length === 0) return;

    setContextTargetId(memberId);
    showContextMenu(
      { x: e.clientX, y: e.clientY },
      options,
      async (option) => {
        if (option.name === 'Remove Member') {
          await removeMember('Removing Member', {
            chatId: chatId ?? '',
            memberToBeRemoved: memberId,
          });
        }
        if (option.name === 'Make group admin') {
          await setMemberAdmin('Updating admin…', {
            chatId: chatId ?? '',
            memberId,
            makeAdmin: true,
          });
        }
        if (option.name === 'Dismiss as admin') {
          await setMemberAdmin('Updating admin…', {
            chatId: chatId ?? '',
            memberId,
            makeAdmin: false,
          });
        }
        setContextTargetId(null);
      },
    );
  };

  useEffect(() => {
    if (!menuState.visible) setContextTargetId(null);
  }, [menuState.visible]);

  const filteredNonGroupMembers = NonGroupMembersData.filter((user) =>
    user.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <DialogWrapper isOpen={isMemberDialog}>
      <div className="flex h-full min-h-0 flex-col px-6 py-4">
        <div className="flex shrink-0 items-center justify-between">
          <p className="text-xl font-medium">
            <span
              onClick={() => setIsMemberDialog(false)}
              className="mr-4 inline-block rotate-180 cursor-pointer transition hover:text-red"
            >
              ↪
            </span>
            {isAddMember ? 'Add Members' : `Members (${members?.length})`}
          </p>
          {isAddMember ? (
            <button
              type="button"
              className="rounded-2xl border border-green-light bg-transparent px-4 py-0.5 text-green transition-[background-color,border-color] duration-200 ease-out hover:border-green hover:bg-green-dark hover:[filter:none] active:opacity-90 active:[filter:none]"
              onClick={onSubmit}
              disabled={isLoading}
            >
              Add
            </button>
          ) : null}
        </div>

        <div className="full-border my-4 flex shrink-0 flex-col gap-2 border py-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-body-700 sm:text-base">Search For Members :</span>
          <Searchbar
            width="w-[min(100%,20rem)]"
            searchText={searchText}
            setSearchText={setSearchText}
          />
        </div>

        {!isAddMember && canManageMembers ? (
          <button
            type="button"
            className="group mb-2 flex shrink-0 items-center gap-2 text-body-700 transition hover:text-green"
            onClick={addMemberHandler}
          >
            <div className="rounded-full border border-border p-2 transition group-hover:border-green-light">
              <AddMemberIcon
                className={'h-7 w-7 transition group-hover:fill-green'}
              />
            </div>
            Add Members
          </button>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          {isAddMember ? (
            <>
              <p className="mb-4 shrink-0 font-medium text-body-300">
                Suggested
              </p>
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto scrollbar-hide">
                {isAvailableMembersLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <AvatarSkeleton
                        key={i}
                        className={'h-20 bg-transparent px-4'}
                      />
                    ))
                ) : NonGroupMembersData.length === 0 ? (
                  <EmptyState
                    className="h-full"
                    imageSrc="/images/no-member.svg"
                    imageAlt="no member"
                    imageClassName="w-60 opacity-50"
                    titleClassName="mt-6 text-center text-xl font-semibold text-body-300"
                    title="No Member To Show"
                  />
                ) : (
                  filteredNonGroupMembers.map((member) => (
                    <SuggestionListItem
                      key={member._id}
                      data={{
                        _id: member._id,
                        name: member.name,
                        avatar:
                          typeof member.avatar === 'string'
                            ? member.avatar
                            : (member.avatar?.url ?? null),
                      }}
                      isSelected={selectedMembers.includes(member._id)}
                      handleSelectMember={handleSelectMember}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 shrink-0 px-2 font-medium text-body-300">
                Existing Members
              </p>
              <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide">
                {members.length === 0 ? (
                  <EmptyState
                    className="h-full"
                    imageSrc="/images/no-member.svg"
                    imageAlt="no member"
                    imageClassName="w-60 opacity-50"
                    titleClassName="mt-6 text-center text-xl font-semibold text-body-300"
                    title="No Member To Show"
                  />
                ) : (
                  filteredMembers.map((member) => {
                    const { _id, name, avatar, isCreator, isAdmin } = member;
                    const isContextTarget = contextTargetId === _id;
                    return (
                      <div
                        key={_id}
                        className={`relative flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 transition ${
                          isContextTarget
                            ? 'bg-gradient-line-fade-light'
                            : 'hover:bg-gradient-line-fade-light'
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, member)}
                      >
                        <AvatarCard avatars={[avatar]} />
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-body-700">
                          <p className="min-w-0 truncate font-medium capitalize">
                            {name}
                          </p>
                          {isCreator ? (
                            <span className="shrink-0 rounded-full border border-green-light bg-green-dark/45 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-green">
                              Creator
                            </span>
                          ) : isAdmin ? (
                            <span className="shrink-0 rounded-full border border-blue-light bg-blue/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue">
                              Admin
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
                <ContextMenu
                  menuState={menuState}
                  hideContextMenu={closeContextMenu}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </DialogWrapper>
  );
};

export default AddMemberDialog;
