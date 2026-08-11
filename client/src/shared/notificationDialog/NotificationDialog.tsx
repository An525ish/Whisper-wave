import DialogWrapper from "@/components/ui/DialogWrapper"
import NotificationTabView from "./NotificationTabView"

type NotificationDialogProps = {
    isNotification: boolean;
};

const NotificationDialog = ({ isNotification }: NotificationDialogProps) => {
    return (
        <DialogWrapper isOpen={isNotification}>
            <div className="flex h-full min-h-0 flex-col p-2">
                <NotificationTabView />
            </div>
        </DialogWrapper>
    )
}

export default NotificationDialog
