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

const NotificationHeader = ({
  onClose,
  isFullscreen,
}: {
  onClose: () => void;
  isFullscreen: boolean;
}) => (
  <header
    className={`flex shrink-0 items-center border-b border-border/60 ${
      isFullscreen ? 'gap-0.5 px-3 pb-2 pt-2' : 'mb-1 gap-1 px-1 pb-2'
    }`}
  >
    <button
      type="button"
      onClick={onClose}
      className={
        isFullscreen
          ? 'inline-flex h-10 items-center gap-0.5 rounded-lg px-1.5 text-body transition active:bg-primary/50 active:text-white'
          : 'grid h-10 w-10 place-items-center rounded-full transition active:bg-primary/70'
      }
      aria-label="Close notifications"
    >
      <ChevronLeft className={isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} />
      {isFullscreen ? (
        <span className="pr-1 text-sm font-medium text-body-700">Back</span>
      ) : null}
    </button>
    <p
      id="notifications-sheet-title"
      className={`min-w-0 truncate font-semibold text-white ${
        isFullscreen ? 'flex-1 text-center text-base' : 'text-lg'
      }`}
    >
      Notifications
    </p>
    {isFullscreen ? (
      <span className="inline-block w-17 shrink-0" aria-hidden />
    ) : null}
  </header>
);

const NotificationDialog = ({
  isNotification,
  onClose,
  variant = 'panel',
}: NotificationDialogProps) => {
  const isFullscreen = variant === 'fullscreen';

  if (isFullscreen && onClose) {
    return (
      <BottomSheet
        open={isNotification}
        onClose={onClose}
        labelledBy="notifications-sheet-title"
        closeLabel="Close notifications"
      >
        <NotificationHeader onClose={onClose} isFullscreen />
        <div className="min-h-0 flex-1 p-2 sm:p-3">
          <NotificationTabView />
        </div>
      </BottomSheet>
    );
  }

  return (
    <DialogWrapper isOpen={isNotification} className="rounded-xl">
      <div className="flex h-full min-h-0 flex-col p-2 sm:p-3">
        {onClose ? (
          <NotificationHeader onClose={onClose} isFullscreen={false} />
        ) : null}
        <div className="min-h-0 flex-1">
          <NotificationTabView />
        </div>
      </div>
    </DialogWrapper>
  );
};

export default NotificationDialog;
