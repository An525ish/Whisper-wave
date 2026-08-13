import ImageViewer from '@/shared/components/image-viewer/ImageViewer'
import Image from '@/shared/components/ui/Image'
import { useProfilePanel } from '@/features/profile/hooks/useProfilePanel'
import { ProfileNameBlock, ProfileBioSection } from '@/features/profile/components/ProfileForm'
import GroupMembersList from '@/features/profile/components/GroupMembersList'
import ProfileActions from '@/features/profile/components/ProfileActions'
import SharedContentSheet from '@/features/profile/components/SharedContentSheet'

type ProfilePanelProps = {
  variant?: 'column' | 'sheet'
  forceSelf?: boolean
}

const ProfilePanel = ({ variant = 'column', forceSelf = false }: ProfilePanelProps) => {
  const p = useProfilePanel(variant, forceSelf)

  if (p.chatId && !p.showSelfProfile) {
    if (p.isLoading) return <></>
  }

  const formProps = {
    name: p.name, bio: p.bio, isSheet: p.isSheet, canEdit: p.canEdit,
    showSelfProfile: p.showSelfProfile, isSaving: p.isSaving,
    editingName: p.editingName, editingBio: p.editingBio,
    nameDraft: p.nameDraft, bioDraft: p.bioDraft,
    nameMaxLength: p.nameMaxLength, bioMaxLength: p.bioMaxLength,
    groupChat: p.groupChat, setNameDraft: p.setNameDraft, setBioDraft: p.setBioDraft,
    startNameEdit: p.startNameEdit, cancelNameEdit: p.cancelNameEdit, saveName: p.saveName,
    startBioEdit: p.startBioEdit, cancelBioEdit: p.cancelBioEdit, saveBio: p.saveBio,
  }

  const avatarContent = (sizeClass: string, borderClass: string) => (
    <>
      <div className={`${sizeClass} overflow-hidden rounded-full`}>
        <Image src={p.avatarSrc} className="h-full w-full object-cover" alt={p.name} />
      </div>
      {p.canEdit ? (
        <>
          <label
            htmlFor={p.avatarInputId}
            className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 opacity-0 transition duration-200 hover:bg-black/45 hover:opacity-100 ${p.isSaving ? 'pointer-events-none' : ''}`}
            title={p.groupChat ? 'Change group photo' : 'Change photo'}
          >
            <img src="https://raw.githubusercontent.com/ThiagoLuizNunes/angular-boilerplate/master/src/assets/imgs/camera-white.png" alt="" className="h-8 w-8" />
          </label>
          <button
            type="button" onClick={() => p.avatarInputRef.current?.click()} disabled={p.isSaving}
            className={`absolute ${borderClass} z-10 flex h-7 w-7 items-center justify-center rounded-full bg-green text-black shadow-md ring-2 ring-background disabled:opacity-60`}
            aria-label={p.groupChat ? 'Change group photo' : 'Change photo'}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
              <path d="M4 8.5h2.2l1.1-1.8h5.4L14 8.5H16.5A1.5 1.5 0 0 1 18 10v7.5A1.5 1.5 0 0 1 16.5 19h-9A1.5 1.5 0 0 1 6 17.5V10a1.5 1.5 0 0 1 1.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <input ref={p.avatarInputRef} id={p.avatarInputId} type="file" accept="image/*" className="hidden" onChange={p.handleAvatarChange} />
        </>
      ) : null}
    </>
  )

  const bioSection = <ProfileBioSection {...formProps} />

  return (
    <>
      {p.sharedSheetOpen ? (
        <SharedContentSheet
          mediaFiles={p.mediaFiles} docFiles={p.docFiles} links={p.sharedLinks}
          initialTab={p.sharedSheetTab} onClose={() => p.setSharedSheetOpen(false)}
          onOpenPhoto={p.openImageViewerForFile} onOpenDocument={p.handleFileAction}
        />
      ) : null}
      {p.viewerOpen ? (
        <ImageViewer mediaFiles={p.viewerMediaFiles} initialIndex={p.initialImageIndex} onClose={() => p.setViewerOpen(false)} />
      ) : null}

      <div className={p.isSheet
        ? 'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-none bg-background py-2 lg:rounded-2xl lg:bg-background-alt'
        : 'relative mt-14 flex min-h-0 flex-1 flex-col rounded-2xl bg-background-alt py-2'
      }>
        {p.isSheet ? (
          <div className="flex shrink-0 flex-col items-center gap-2 px-4 pb-2 pt-1">
            <div className="relative h-20 w-20 rounded-full border-4 border-background bg-primary">
              {avatarContent('h-full w-full', '-bottom-0.5 -right-0.5')}
            </div>
            <ProfileNameBlock {...formProps} />
          </div>
        ) : (
          <>
            <div className="absolute -top-14 left-1/2 z-10 h-24 w-24 -translate-x-1/2 rounded-full border-8 border-background bg-primary">
              {avatarContent('h-full w-full', 'bottom-0 right-0')}
            </div>
            <ProfileNameBlock {...formProps} />
          </>
        )}

        <div className={`mt-2 flex min-h-0 flex-1 flex-col ${p.isSheet ? 'overflow-y-auto overscroll-contain scrollbar-hide' : ''}`}>
          <div className="shrink-0">
            {p.chatId && p.groupChat ? (
              <>
                <GroupMembersList creator={p.creator} members={p.members} />
                {bioSection}
              </>
            ) : bioSection}
          </div>

          {!p.showSelfProfile ? (
            <div className={p.isSheet ? 'mt-2 border-t border-border/80 px-3 pb-4 pt-4' : 'mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border/80 px-3 pb-4 pt-4'}>
              <ProfileActions
                mediaFiles={p.mediaFiles} docFiles={p.docFiles} sharedLinks={p.sharedLinks}
                isMediaLoading={p.isMediaLoading} openSharedSheet={p.openSharedSheet}
                openImageViewerForFile={p.openImageViewerForFile} handleFileAction={p.handleFileAction}
              />
            </div>
          ) : null}

          {p.showSelfProfile ? (
            <div className="mt-auto flex min-h-0 flex-1 flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:pb-5">
              <div className="flex min-h-0 flex-1 items-center justify-center py-2 sm:py-3">
                <img src="/images/profile-illustration.svg" alt="" className="pointer-events-none h-auto w-full max-h-[34vh] max-w-64 select-none object-contain opacity-85 sm:max-h-[40vh] sm:max-w-76 md:max-w-84" />
              </div>
              <div className="flex w-full max-w-70 shrink-0 items-center gap-2 self-center sm:max-w-xs">
                <button
                  type="button" onClick={p.handleCancelSelfProfile} disabled={p.isSaving}
                  className="flex-1 rounded-xl border border-border/70 px-3 py-2.5 text-sm font-medium text-body-300 transition hover:border-border hover:bg-primary/40 hover:text-body disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button" onClick={() => void p.handleDoneSelfProfile()}
                  disabled={p.isSaving || (!p.profileDirty && !p.showSelfExitActions)}
                  className="flex-1 rounded-xl bg-green px-3 py-2.5 text-sm font-medium text-black transition hover:bg-green/90 disabled:opacity-40"
                >
                  {p.profileDirty ? 'Save' : 'Done'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default ProfilePanel
