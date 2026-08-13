import { useEffect, useState, type Dispatch, type MouseEvent, type SetStateAction } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';
import useContextMenu from '@/shared/hooks/useContextMenu';
import type { ContextMenuOption, ContextMenuState } from '@/shared/hooks/useContextMenu';
import {
  useAddMemberMutation,
  useChatDetailsQuery,
  useMyFriendsQuery,
  useRemoveMemberMutation,
  useSetMemberAdminMutation,
} from '@/features/chat/hooks';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import type { User } from '@/shared/types';

type GroupMember = {
  _id: string;
  name: string;
  avatar?: string;
  isCreator?: boolean;
  isAdmin?: boolean;
};

type FriendsResponse = { data?: User[] };

type ChatDetailsResponse = {
  data?: {
    members?: GroupMember[];
    myRole?: 'creator' | 'admin' | 'member' | null;
  };
};

export type UseAddMemberReturn = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  selectedMembers: string[];
  isAddMember: boolean;
  contextTargetId: string | null;
  menuState: ContextMenuState;
  members: GroupMember[];
  myRole: 'creator' | 'admin' | 'member' | null;
  canManageMembers: boolean;
  NonGroupMembersData: User[];
  isAvailableMembersLoading: boolean;
  isLoading: boolean;
  filteredMembers: GroupMember[];
  filteredNonGroupMembers: User[];
  handleSelectMember: (id: string) => void;
  addMemberHandler: () => void;
  closeContextMenu: () => void;
  handleContextMenu: (e: MouseEvent, member: GroupMember) => void;
  onSubmit: () => Promise<void>;
};

const useAddMember = (onClose: () => void): UseAddMemberReturn => {
  const [searchText, setSearchText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isAddMember, setIsAddMember] = useState(false);
  const [contextTargetId, setContextTargetId] = useState<string | null>(null);
  const { menuState, showContextMenu, hideContextMenu } = useContextMenu();
  const selfId = useAuthStore((s) => s.user?._id);
  const { chatId } = useParams();

  const { data: chatDetails } = useChatDetailsQuery({ id: chatId, populate: true });
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

  useEffect(() => {
    if (!menuState.visible) setContextTargetId(null);
  }, [menuState.visible]);

  const handleSelectMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((el) => el !== id) : [...prev, id],
    );
  };

  const addMemberHandler = () => setIsAddMember(true);

  const closeContextMenu = () => {
    hideContextMenu();
    setContextTargetId(null);
  };

  const handleContextMenu = (e: MouseEvent, member: GroupMember) => {
    e.preventDefault();
    e.stopPropagation();

    const memberId = String(member._id);
    const options: ContextMenuOption[] = [];

    if (
      canManageMembers &&
      !member.isCreator &&
      memberId !== String(selfId ?? '') &&
      !(myRole === 'admin' && member.isAdmin)
    ) {
      options.push({
        icon: '/icons/remove-user-icon.svg',
        label: 'Remove Member',
        onClick: () => {
          void removeMember('Removing Member', {
            chatId: chatId ?? '',
            memberToBeRemoved: memberId,
          }).then(() => setContextTargetId(null));
        },
      });
    }

    if (myRole === 'creator' && !member.isCreator) {
      const makeAdmin = !member.isAdmin;
      options.push({
        icon: '/icons/remove-user-icon.svg',
        label: member.isAdmin ? 'Dismiss as admin' : 'Make group admin',
        onClick: () => {
          void setMemberAdmin('Updating admin…', {
            chatId: chatId ?? '',
            memberId,
            makeAdmin,
          }).then(() => setContextTargetId(null));
        },
      });
    }

    if (options.length === 0) return;

    setContextTargetId(memberId);
    showContextMenu({ x: e.clientX, y: e.clientY }, options);
  };

  const onSubmit = async () => {
    await addMember('Adding member...', {
      chatId: chatId ?? '',
      members: selectedMembers,
    });
    onClose();
  };

  const filteredNonGroupMembers = NonGroupMembersData.filter((user) =>
    user.name.toLowerCase().includes(searchText.toLowerCase()),
  );
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return {
    searchText,
    setSearchText,
    selectedMembers,
    isAddMember,
    contextTargetId,
    menuState,
    members,
    myRole,
    canManageMembers,
    NonGroupMembersData,
    isAvailableMembersLoading,
    isLoading,
    filteredMembers,
    filteredNonGroupMembers,
    handleSelectMember,
    addMemberHandler,
    closeContextMenu,
    handleContextMenu,
    onSubmit,
  };
};

export default useAddMember;
