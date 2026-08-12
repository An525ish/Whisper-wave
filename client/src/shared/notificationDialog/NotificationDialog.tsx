import DialogWrapper from '@/components/ui/DialogWrapper';
import NotificationTabView from './NotificationTabView';
import ChevronLeft from '@/components/icons/ChevronLeft';

type NotificationDialogProps = {
  isNotification: boolean;
  onClose?: () => void;
};

const NotificationDialog = ({
  isNotification,
  onClose,
}: NotificationDialogProps) => {
  return (
    <DialogWrapper isOpen={isNotification}>
      <div className="flex h-full min-h-0 flex-col p-2">
        {onClose ? (
          <div className="mb-1 flex shrink-0 items-center gap-1 border-b border-border/60 px-1 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full transition active:bg-primary/70"
              aria-label="Close notifications"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-lg font-semibold text-white">Notifications</p>
          </div>
        ) : null}
        <div className="min-h-0 flex-1">
          <NotificationTabView />
        </div>
      </div>
    </DialogWrapper>
  );
};

export default NotificationDialog;
