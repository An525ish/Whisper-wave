import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { useUpdateProfileMutation } from '@/features/auth';
import { useUpdateGroupDetailsMutation } from '@/features/chat';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import type { User } from '@/shared/types';

const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type UseProfileEditingParams = {
  isOwnProfile: boolean;
  canEdit: boolean;
  chatId: string | undefined;
  name: string | undefined;
  bio: string | undefined;
  groupChat: boolean | undefined;
  user: User | null | undefined;
  showSelfProfile: boolean;
  showSelfExitActions: boolean;
  closeSelfProfile: () => void;
};

/**
 * Owns inline name/bio editing and avatar upload for the profile panel — for both
 * the current user's own profile and (when permitted) the group's details.
 */
export const useProfileEditing = ({
  isOwnProfile, canEdit, chatId, name, bio, groupChat,
  user, showSelfProfile, showSelfExitActions, closeSelfProfile,
}: UseProfileEditingParams) => {
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [updateProfile, { isLoading: isUpdatingProfile }] = useAsyncMutation(useUpdateProfileMutation);
  const [updateGroup, { isLoading: isUpdatingGroup }] = useAsyncMutation(useUpdateGroupDetailsMutation);
  const isSaving = isUpdatingProfile || isUpdatingGroup;

  // Revoke any object URL created for the avatar preview.
  useEffect(() => {
    return () => { if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview); };
  }, [avatarPreview]);

  // On the self profile, keep drafts in sync with the live user and reset edit modes.
  useEffect(() => {
    if (!showSelfProfile) return;
    setNameDraft(user?.name ?? '');
    setBioDraft(user?.bio ?? '');
    setEditingName(false);
    setEditingBio(false);
  }, [showSelfProfile, user?.name, user?.bio]);

  const startNameEdit = useCallback(() => { setNameDraft(name ?? ''); setEditingName(true); setEditingBio(false); }, [name]);
  const cancelNameEdit = useCallback(() => { setEditingName(false); setNameDraft(name ?? ''); }, [name]);

  const saveName = useCallback(async (): Promise<boolean> => {
    const nextName = nameDraft.trim();
    if (!nextName) { toast.error(groupChat ? 'Group name is required' : 'Name is required'); return false; }
    if (isOwnProfile) {
      const formData = new FormData(); formData.append('name', nextName);
      const result = await updateProfile('Updating name...', formData);
      if (result) { setEditingName(false); return true; }
      return false;
    }
    if (!chatId) return false;
    const formData = new FormData(); formData.append('name', nextName);
    const result = await updateGroup(null, { chatId, body: formData });
    if (result !== null) { setEditingName(false); return true; }
    return false;
  }, [nameDraft, groupChat, isOwnProfile, chatId, updateProfile, updateGroup]);

  const startBioEdit = useCallback(() => { setBioDraft(bio ?? ''); setEditingBio(true); setEditingName(false); }, [bio]);
  const cancelBioEdit = useCallback(() => { setEditingBio(false); setBioDraft(bio ?? ''); }, [bio]);

  const saveBio = useCallback(async (): Promise<boolean> => {
    const nextBio = bioDraft.trim();
    if (isOwnProfile) {
      const formData = new FormData(); formData.append('bio', nextBio);
      const result = await updateProfile('Updating bio...', formData);
      if (result) { setEditingBio(false); return true; }
      return false;
    }
    if (!chatId) return false;
    const formData = new FormData(); formData.append('bio', nextBio);
    const result = await updateGroup(null, { chatId, body: formData });
    if (result !== null) { setEditingBio(false); return true; }
    return false;
  }, [bioDraft, isOwnProfile, chatId, updateProfile, updateGroup]);

  const handleCancelSelfProfile = useCallback(() => {
    setNameDraft(name ?? ''); setBioDraft(bio ?? '');
    setEditingName(false); setEditingBio(false);
    if (showSelfExitActions) closeSelfProfile();
  }, [name, bio, showSelfExitActions, closeSelfProfile]);

  const handleAvatarChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !canEdit) return;
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) { toast.error('Use JPEG, PNG, WebP, or GIF'); return; }
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    const formData = new FormData(); formData.append('avatar', file);
    if (isOwnProfile) {
      await updateProfile('Updating photo...', formData);
      setAvatarPreview(null); URL.revokeObjectURL(previewUrl);
      return;
    }
    if (!chatId) return;
    await updateGroup(null, { chatId, body: formData });
    setAvatarPreview(null); URL.revokeObjectURL(previewUrl);
  }, [canEdit, avatarPreview, isOwnProfile, chatId, updateProfile, updateGroup]);

  return {
    editingName, editingBio, nameDraft, bioDraft, setNameDraft, setBioDraft,
    startNameEdit, cancelNameEdit, saveName, startBioEdit, cancelBioEdit, saveBio,
    handleCancelSelfProfile, handleAvatarChange, avatarPreview, isSaving,
  };
};
