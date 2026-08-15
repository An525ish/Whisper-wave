import ImageViewer from '@/components/ui/image-viewer/ImageViewer'
import Image from '@/components/ui/Image'
import { useProfilePanel } from '@/hooks/profile/useProfilePanel'
import { ProfileNameBlock, ProfileBioSection } from '@/components/profile/ProfileForm'
import GroupMembersList from '@/components/profile/GroupMembersList'
import ProfileActions from '@/components/profile/ProfileActions'
import SharedContentSheet from '@/components/profile/SharedContentSheet'
import ProfilePanelSkeleton from '@/components/profile/ProfilePanelSkeleton'

type ProfilePanelProps = {
  variant?: 'column' | 'sheet'
  forceSelf?: boolean
}

const ProfilePanel = ({ variant = 'column', forceSelf = false }: ProfilePanelProps) => {
  const p = useProfilePanel(variant, forceSelf)

  if (p.chatId && !p.showSelfProfile && p.isLoading) {
    return <ProfilePanelSkeleton variant={variant} />
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

        <div className={`mt-2 flex min-h-0 flex-1 flex-col ${p.isSheet ? 'overflow-y-auto overscroll-contain scrollbar-hide' : 'min-h-0 overflow-hidden'}`}>
          <div className="relative z-20 shrink-0">
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
            <div className="mt-auto flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:pb-5">
              <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden py-2 sm:gap-3.5 sm:py-3">
                <div
                  className="pointer-events-none absolute inset-x-8 top-[42%] h-28 max-h-[40%] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(1,195,109,0.12)_0%,transparent_70%)] blur-2xl"
                  aria-hidden
                />
                <img
                  src="/images/profile-illustration.svg"
                  alt=""
                  className="pointer-events-none relative z-[1] h-auto w-full min-h-0 max-h-[min(11rem,26vh)] max-w-52 select-none object-contain opacity-90 sm:max-h-[min(14rem,32vh)] sm:max-w-72 md:max-w-80"
                />
                <div className="relative z-[1] mx-auto flex w-full max-w-xs shrink-0 flex-col items-center gap-2.5 pb-1 pt-0.5 text-center sm:gap-3">
                  <svg
                    viewBox="0 0 160 12"
                    className="h-3 w-40 text-green/35"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M0 7 C20 2 40 12 60 7 C80 2 100 12 120 7 C140 2 150 7 160 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p className="font-display text-lg leading-snug text-body sm:text-xl">
                    Your whisper. Your wave.
                  </p>
                  <p className="max-w-[16rem] text-xs leading-relaxed text-body-300 sm:text-sm">
                    Soft edits. Instant ripples. The pencil is yours.
                  </p>

                  {p.showSelfExitActions ? (
                    <button
                      type="button"
                      onClick={p.handleCancelSelfProfile}
                      disabled={p.isSaving}
                      className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-green transition hover:text-green/85 disabled:opacity-40"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                        <path
                          d="M15 6 9 12l6 6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Back to conversation
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default ProfilePanel
