import DialogWrapper from '@/components/ui/DialogWrapper';
import BottomSheet from '@/components/ui/BottomSheet';
import NotificationTabView from '@/components/notifications/NotificationTabView';
import ChevronLeft from '@/components/ui/icons/ChevronLeft';

type NotificationDialogProps = {
  isNotification: boolean;
  onClose?: () => void;
  /** Full-viewport shell for phones; column fill for desktop side panel. */
  variant?: 'panel' | 'fullscreen';
};

const NotificationHeader = ({ onClose }: { onClose: () => void }) => (
  <header className="shrink-0 px-3 pb-4 pt-2 sm:px-5">
    <div className="flex h-11 items-center gap-2.5">
      <button
        type="button"
        onClick={onClose}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/12 bg-white/6 text-body transition hover:border-green/40 hover:bg-green/10 hover:text-green"
        aria-label="Close notifications"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-0.5">
        <h2
          id="notifications-sheet-title"
          className="truncate text-[15px] font-semibold leading-tight tracking-tight text-white"
        >
          Notifications
        </h2>
        <p className="truncate text-xs leading-tight text-body-300">
          Messages and friend requests
        </p>
      </div>
    </div>
  </header>
);

const NotificationBody = ({ onClose }: { onClose?: () => void }) => (
  <>
    {onClose ? <NotificationHeader onClose={onClose} /> : null}
    <div className="min-h-0 flex-1 overflow-hidden px-3 pb-4 sm:px-5">
      <NotificationTabView />
    </div>
  </>
);

const NotificationDialog = ({
  isNotification,
  onClose,
  variant = 'panel',
}: NotificationDialogProps) => {
  if (variant === 'fullscreen' && onClose) {
    return (
      <BottomSheet
        open={isNotification}
        onClose={onClose}
        labelledBy="notifications-sheet-title"
        closeLabel="Close notifications"
      >
        <NotificationBody onClose={onClose} />
      </BottomSheet>
    );
  }

  return (
    <DialogWrapper isOpen={isNotification} className="rounded-xl">
      <div className="flex h-full min-h-0 flex-col">
        <NotificationBody onClose={onClose} />
      </div>
    </DialogWrapper>
  );
};

export default NotificationDialog;
