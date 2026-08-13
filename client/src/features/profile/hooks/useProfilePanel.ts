import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store'
import { useProfileUiStore } from '@/features/profile/store'
import {
  useChatDetailsQuery,
  useGetMediaQuery,
  useUpdateGroupDetailsMutation,
  useUpdateProfileMutation,
} from '@/features/chat/hooks'
import useAsyncMutation from '@/shared/hooks/useAsyncMutation'
import useErrors from '@/shared/hooks/useError'
import { useSocket } from '@/socket/SocketProvider'
import useSocketEvent from '@/shared/hooks/useSocketEvent'
import { fileFormat } from '@/shared/utils/fileFormat'
import { SOCKET_EVENTS } from '@/shared/constants/socketEvents'
import type { SharedContentTab } from '@/features/profile/components/SharedContentSheet'
import type { MediaFile, SharedLink } from '@/features/profile/components/shared-content/types'

type ProfileMember = {
  _id?: string;
  name?: string;
  avatar?: string;
  isCreator?: boolean;
  isAdmin?: boolean;
};

type ProfileDetailsData = {
  name?: string;
  avatar?: string | string[] | { url?: string };
  bio?: string;
  creator?: { _id?: string; name?: string; avatar?: string };
  members?: ProfileMember[];
  groupChat?: boolean;
};

type ChatDetailsResponse = { data?: ProfileDetailsData };
type MediaResponse = {
  data?: MediaFile[] | { attachments?: MediaFile[]; links?: SharedLink[] };
};

export type ViewerMediaFile = {
  _id: string;
  url: string;
  name?: string;
  publicId?: string;
  fileType?: string;
};

const resolveAvatarSrc = (
  rawAvatar: string | string[] | { url?: string } | undefined,
): string | undefined => {
  if (!rawAvatar) return undefined
  if (typeof rawAvatar === 'string') return rawAvatar
  if (Array.isArray(rawAvatar)) {
    const first = rawAvatar.find((item) => typeof item === 'string' && item)
    return typeof first === 'string' ? first : undefined
  }
  if (typeof rawAvatar === 'object' && 'url' in rawAvatar) return rawAvatar.url
  return undefined
}

const normalizeSharedContent = (
  data: MediaResponse['data'],
): { attachments: MediaFile[]; links: SharedLink[] } => {
  if (!data) return { attachments: [], links: [] }
  if (Array.isArray(data)) return { attachments: data, links: [] }
  return { attachments: data.attachments ?? [], links: data.links ?? [] }
}

export type UseProfilePanelReturn = {
  showSelfProfile: boolean
  isOwnProfile: boolean
  canEdit: boolean
  isSaving: boolean
  groupChat: boolean | undefined
  name: string | undefined
  bio: string | undefined
  avatarSrc: string | undefined
  creator: ProfileDetailsData['creator'] | undefined
  members: ProfileMember[] | undefined
  chatId: string | undefined
  mediaFiles: MediaFile[]
  docFiles: MediaFile[]
  sharedLinks: SharedLink[]
  isMediaLoading: boolean
  viewerMediaFiles: ViewerMediaFile[]
  editingName: boolean
  editingBio: boolean
  nameDraft: string
  bioDraft: string
  setNameDraft: (v: string) => void
  setBioDraft: (v: string) => void
  nameMaxLength: number
  bioMaxLength: number
  sharedSheetOpen: boolean
  sharedSheetTab: SharedContentTab
  viewerOpen: boolean
  initialImageIndex: number
  showSelfExitActions: boolean
  isSheet: boolean
  avatarInputId: string
  avatarInputRef: React.RefObject<HTMLInputElement | null>
  openSharedSheet: (tab: SharedContentTab) => void
  openImageViewerForFile: (file: MediaFile) => void
  handleFileAction: (e: MouseEvent, url: string | undefined, fileName: string | undefined) => Promise<void>
  startNameEdit: () => void
  cancelNameEdit: () => void
  saveName: () => Promise<boolean>
  startBioEdit: () => void
  cancelBioEdit: () => void
  saveBio: () => Promise<boolean>
  handleCancelSelfProfile: () => void
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  setViewerOpen: (v: boolean) => void
  setSharedSheetOpen: (v: boolean) => void
  isLoading: boolean
  viewSelfProfile: boolean
}

export const useProfilePanel = (
  variant: 'column' | 'sheet' = 'column',
  forceSelf = false,
): UseProfilePanelReturn => {
  const { chatId } = useParams()
  const socket = useSocket()
  const isSheet = variant === 'sheet'
  const avatarInputId = useId()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const user = useAuthStore((s) => s.user)
  const viewSelfProfile = useProfileUiStore((s) => s.viewSelfProfile)
  const closeSelfProfile = useProfileUiStore((s) => s.closeSelfProfile)
  const showSelfProfile = forceSelf || viewSelfProfile || !chatId

  const [viewerOpen, setViewerOpen] = useState(false)
  const [initialImageIndex, setInitialImageIndex] = useState(0)
  const [sharedSheetOpen, setSharedSheetOpen] = useState(false)
  const [sharedSheetTab, setSharedSheetTab] = useState<SharedContentTab>('photos')
  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [updateProfile, { isLoading: isUpdatingProfile }] = useAsyncMutation(useUpdateProfileMutation)
  const [updateGroup, { isLoading: isUpdatingGroup }] = useAsyncMutation(useUpdateGroupDetailsMutation)

  const openSharedSheet = (tab: SharedContentTab) => {
    setSharedSheetTab(tab)
    setSharedSheetOpen(true)
  }

  const { data: profileDetails, isLoading, error, isError } = useChatDetailsQuery(
    { id: chatId, populate: true },
    { skip: !chatId || showSelfProfile },
  )
  const { data: media, isLoading: isMediaLoading, error: mediaError, isError: isMediaError, refetch } = useGetMediaQuery(
    { chatId },
    { skip: !chatId || showSelfProfile },
  )

  useErrors([{ error, isError }, { mediaError, isMediaError }])

  const newAttachmentListener = useCallback(() => { refetch() }, [refetch])
  useSocketEvent(socket, { [SOCKET_EVENTS.NEW_ATTACHMENT]: newAttachmentListener, [SOCKET_EVENTS.NEW_MESSAGE]: newAttachmentListener })

  useEffect(() => {
    return () => { if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview) }
  }, [avatarPreview])

  useEffect(() => {
    if (!showSelfProfile) return
    setNameDraft(user?.name ?? '')
    setBioDraft(user?.bio ?? '')
    setEditingName(false)
    setEditingBio(false)
  }, [showSelfProfile, user?.name, user?.bio])

  const typedProfile = profileDetails as ChatDetailsResponse | undefined
  const profileData = showSelfProfile ? user : typedProfile?.data
  const name = profileData && 'name' in profileData ? profileData.name : undefined
  const bio = profileData && 'bio' in profileData ? profileData.bio : undefined
  const groupChat = showSelfProfile ? false : (profileData && 'groupChat' in profileData ? profileData.groupChat : undefined)
  const creator = showSelfProfile ? undefined : (profileData && 'creator' in profileData ? profileData.creator : undefined)
  const members = showSelfProfile ? undefined : (profileData && 'members' in profileData ? profileData.members as ProfileMember[] | undefined : undefined)
  const rawAvatar = profileData && 'avatar' in profileData ? profileData.avatar : undefined

  const userId = user?._id ? String(user._id) : ''
  const isOwnProfile = showSelfProfile
  const isGroupCreator = Boolean(groupChat) && (
    (members ?? []).some((m) => m.isCreator && String(m._id) === userId) ||
    (creator?._id != null && String(creator._id) === userId)
  )
  const isGroupAdmin = Boolean(groupChat) && (members ?? []).some((m) => m.isAdmin && String(m._id) === userId)
  const canEdit = isOwnProfile || isGroupCreator || isGroupAdmin
  const isSaving = isUpdatingProfile || isUpdatingGroup

  const { attachments: mediaData, links: sharedLinks } = normalizeSharedContent((media as MediaResponse | undefined)?.data)
  const mediaFiles = mediaData.filter((f) => f.fileType !== 'document')
  const docFiles = mediaData.filter((f) => f.fileType === 'document')

  const viewerMediaFiles: ViewerMediaFile[] = mediaFiles
    .filter((f): f is MediaFile & { url: string } => Boolean(f.url))
    .map((f) => ({ _id: f._id ?? f.publicId ?? f.url, url: f.url, name: f.name, publicId: f.publicId, fileType: f.fileType }))

  const openImageViewerForFile = (file: MediaFile) => {
    const index = viewerMediaFiles.findIndex(
      (item) => item.url === file.url || (file._id && item._id === file._id) || (file.publicId && item._id === file.publicId),
    )
    if (index >= 0) { setInitialImageIndex(index); setViewerOpen(true) }
  }

  const handleFileAction = async (e: MouseEvent, url: string | undefined, fileName: string | undefined) => {
    e.preventDefault()
    if (!url) return
    if (['pdf'].includes(fileFormat(url))) {
      window.open(url, '_blank')
    } else {
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = fileName ?? 'download'
        link.click()
        window.URL.revokeObjectURL(url)
      } catch {
        toast.error('Download Failed')
      }
    }
  }

  const startNameEdit = () => { setNameDraft(name ?? ''); setEditingName(true); setEditingBio(false) }
  const cancelNameEdit = () => { setEditingName(false); setNameDraft(name ?? '') }

  const saveName = async (): Promise<boolean> => {
    const nextName = nameDraft.trim()
    if (!nextName) { toast.error(groupChat ? 'Group name is required' : 'Name is required'); return false }
    if (isOwnProfile) {
      const formData = new FormData(); formData.append('name', nextName)
      const result = await updateProfile('Updating name...', formData)
      if (result) { setEditingName(false); return true }
      return false
    }
    if (!chatId) return false
    const formData = new FormData(); formData.append('name', nextName)
    const result = await updateGroup('Updating group name...', { chatId, body: formData })
    if (result !== null) { setEditingName(false); return true }
    return false
  }

  const startBioEdit = () => { setBioDraft(bio ?? ''); setEditingBio(true); setEditingName(false) }
  const cancelBioEdit = () => { setEditingBio(false); setBioDraft(bio ?? '') }

  const saveBio = async (): Promise<boolean> => {
    const nextBio = bioDraft.trim()
    if (isOwnProfile) {
      const formData = new FormData(); formData.append('bio', nextBio)
      const result = await updateProfile('Updating bio...', formData)
      if (result) { setEditingBio(false); return true }
      return false
    }
    if (!chatId) return false
    const formData = new FormData(); formData.append('bio', nextBio)
    const result = await updateGroup('Updating group bio...', { chatId, body: formData })
    if (result !== null) { setEditingBio(false); return true }
    return false
  }

  const showSelfExitActions = viewSelfProfile && Boolean(chatId)

  const handleCancelSelfProfile = () => {
    setNameDraft(name ?? ''); setBioDraft(bio ?? '')
    setEditingName(false); setEditingBio(false)
    if (showSelfExitActions) closeSelfProfile()
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !canEdit) return
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return }
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    const formData = new FormData(); formData.append('avatar', file)
    if (isOwnProfile) {
      await updateProfile('Updating photo...', formData)
      setAvatarPreview(null); URL.revokeObjectURL(previewUrl)
      return
    }
    if (!chatId) return
    await updateGroup('Updating group photo...', { chatId, body: formData })
    setAvatarPreview(null); URL.revokeObjectURL(previewUrl)
  }

  const avatarSrc = avatarPreview ?? resolveAvatarSrc(rawAvatar as string | string[] | { url?: string } | undefined)

  return {
    showSelfProfile, isOwnProfile, canEdit, isSaving, groupChat, name, bio, avatarSrc, creator, members, chatId,
    mediaFiles, docFiles, sharedLinks, isMediaLoading, viewerMediaFiles,
    editingName, editingBio, nameDraft, bioDraft, setNameDraft, setBioDraft,
    nameMaxLength: groupChat ? 60 : 50, bioMaxLength: 70,
    sharedSheetOpen, sharedSheetTab, viewerOpen, initialImageIndex,
    showSelfExitActions, isSheet, avatarInputId, avatarInputRef,
    openSharedSheet, openImageViewerForFile, handleFileAction,
    startNameEdit, cancelNameEdit, saveName, startBioEdit, cancelBioEdit, saveBio,
    handleCancelSelfProfile, handleAvatarChange,
    setViewerOpen, setSharedSheetOpen, isLoading, viewSelfProfile,
  }
}
