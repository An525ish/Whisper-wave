import ChevronLeft from '@/components/ui/icons/ChevronLeft';
import ProfilePanel from '@/components/profile/ProfilePanel';
import BottomSheet from '@/components/ui/BottomSheet';

type ProfileSheetProps = {
  open: boolean;
  onClose: () => void;
  /** When true, always show the signed-in user's editable profile. */
  forceSelf?: boolean;
  title?: string;
};

const ProfileSheet = ({
  open,
  onClose,
  forceSelf = false,
  title = 'Profile',
}: ProfileSheetProps) => (
  <BottomSheet
    open={open}
    onClose={onClose}
    labelledBy="profile-sheet-title"
    closeLabel="Close profile"
    sideCardOnDesktop
  >
    <header className="relative shrink-0 px-3 pb-2 pt-2 sm:px-5 lg:pt-3">
      <div className="flex items-center gap-0.5 lg:gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center gap-0.5 rounded-lg px-1.5 text-body transition active:bg-primary/50 active:text-white lg:grid lg:h-10 lg:w-10 lg:place-items-center lg:rounded-full lg:border lg:border-border/80 lg:bg-background-alt/60 lg:px-0 lg:hover:border-green/40 lg:hover:bg-primary/80 lg:hover:text-white"
          aria-label="Close"
        >
          <ChevronLeft className="h-6 w-6 lg:h-5 lg:w-5" />
          <span className="pr-1 text-sm font-medium text-body-700 lg:hidden">
            Back
          </span>
        </button>
        <h2
          id="profile-sheet-title"
          className="min-w-0 flex-1 truncate text-center text-base font-semibold tracking-tight text-white lg:flex-none lg:text-left lg:text-lg"
        >
          {title}
        </h2>
        <span className="inline-block w-17 shrink-0 lg:hidden" aria-hidden />
      </div>
    </header>

    <div className="min-h-0 flex-1 overflow-hidden px-0 pb-0 lg:px-4 lg:pb-4">
      <ProfilePanel variant="sheet" forceSelf={forceSelf} />
    </div>
  </BottomSheet>
);

export default ProfileSheet;
