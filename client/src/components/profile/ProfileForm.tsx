import PencilIcon from '@/components/ui/icons/Pencil'
import { emptyProfileBioCopy } from '@/constants/profileContent'

type ProfileNameBlockProps = {
  name?: string
  isSheet: boolean
  canEdit: boolean
  showSelfProfile: boolean
  editingName: boolean
  nameDraft: string
  nameMaxLength: number
  isSaving: boolean
  groupChat?: boolean
  setNameDraft: (v: string) => void
  startNameEdit: () => void
  cancelNameEdit: () => void
  saveName: () => Promise<boolean>
}

export const ProfileNameBlock = ({
  name, isSheet, canEdit, showSelfProfile, editingName, nameDraft, nameMaxLength,
  isSaving, groupChat, setNameDraft, startNameEdit, cancelNameEdit, saveName,
}: ProfileNameBlockProps) => (
  <div
    className={`flex min-h-10 w-full max-w-72 shrink-0 items-center justify-center gap-1 px-3 sm:max-w-80 ${
      isSheet ? '' : 'mx-auto mt-10'
    }`}
  >
    {editingName ? (
      <>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value.slice(0, nameMaxLength))}
          maxLength={nameMaxLength}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); void saveName() }
            if (e.key === 'Escape') cancelNameEdit()
          }}
          placeholder={showSelfProfile || !groupChat ? 'Your name' : 'Group name'}
          className={`min-w-0 flex-1 border-0 border-b border-green/45 bg-transparent px-1 py-1 text-center font-medium capitalize text-body outline-none ${
            isSheet ? 'text-lg' : 'text-xl'
          }`}
        />
        <button
          type="button" onClick={cancelNameEdit} disabled={isSaving}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-body-300 hover:text-body disabled:opacity-50"
          aria-label="Cancel name edit"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button" onClick={() => void saveName()} disabled={isSaving}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-green hover:bg-green/15 disabled:opacity-50"
          aria-label="Save name"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </>
    ) : (
      <>
        <p className={`min-w-0 truncate text-center font-medium capitalize ${isSheet ? 'text-lg' : 'text-xl'}`}>
          {name}
        </p>
        {canEdit || showSelfProfile ? (
          <button
            type="button" onClick={startNameEdit}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-body-300 transition hover:text-green"
            aria-label={groupChat && !showSelfProfile ? 'Edit group name' : 'Edit name'}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </>
    )}
  </div>
)

type ProfileBioSectionProps = {
  bio?: string
  isSheet: boolean
  canEdit: boolean
  showSelfProfile: boolean
  editingBio: boolean
  bioDraft: string
  bioMaxLength: number
  isSaving: boolean
  groupChat?: boolean
  setBioDraft: (v: string) => void
  startBioEdit: () => void
  cancelBioEdit: () => void
  saveBio: () => Promise<boolean>
}

export const ProfileBioSection = ({
  bio, isSheet, canEdit, showSelfProfile, editingBio, bioDraft, bioMaxLength,
  isSaving, groupChat, setBioDraft, startBioEdit, cancelBioEdit, saveBio,
}: ProfileBioSectionProps) => {
  const bioWidthClass = 'w-[78%] max-w-72 sm:max-w-78 md:w-[72%] md:max-w-70'
  const trimmedBio = bio?.trim()
  const emptyBioCopy = emptyProfileBioCopy({ showSelfProfile, groupChat })
  return (
    <div className="mt-4 flex min-h-22 w-full flex-col items-center px-3 pb-2 text-center sm:min-h-26 sm:px-4">
      <div className="flex w-fit items-center gap-1.5 border-0 border-b full-border px-6 pb-1 sm:px-8">
        <p className="text-body-700 capitalize">Bio</p>
        {(canEdit || showSelfProfile) && !editingBio ? (
          <button
            type="button" onClick={startBioEdit}
            className="grid h-6 w-6 place-items-center rounded-full text-body-300 transition hover:text-green"
            aria-label="Edit bio"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {editingBio ? (
        <div className={`mt-3 rounded-xl border border-border bg-primary/35 p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] focus-within:border-green/50 ${bioWidthClass}`}>
          <textarea
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value.slice(0, bioMaxLength))}
            rows={isSheet ? 2 : 3}
            maxLength={bioMaxLength}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Escape') cancelBioEdit() }}
            placeholder={groupChat && !showSelfProfile ? 'Add a group bio' : 'Write something about yourself'}
            className="w-full resize-none bg-transparent px-1.5 py-1 text-sm leading-relaxed text-body outline-none placeholder:text-body-300"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
            <span className="text-[11px] text-body-300">{bioDraft.length}/{bioMaxLength}</span>
            <div className="flex items-center gap-1">
              <button
                type="button" onClick={cancelBioEdit} disabled={isSaving}
                className="grid h-7 w-7 place-items-center rounded-full text-body-300 hover:text-body disabled:opacity-50"
                aria-label="Cancel bio edit"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button" onClick={() => void saveBio()} disabled={isSaving}
                className="grid h-7 w-7 place-items-center rounded-full text-green hover:bg-green/15 disabled:opacity-50"
                aria-label="Save bio"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                  <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p
          className={`mt-2 wrap-break-word text-sm italic leading-relaxed ${bioWidthClass} ${
            trimmedBio ? 'text-body-300/80' : 'text-body-300/55'
          }`}
        >
          {trimmedBio || emptyBioCopy}
        </p>
      )}
    </div>
  )
}
