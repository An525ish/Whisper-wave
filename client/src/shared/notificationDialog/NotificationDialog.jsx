import DialogWrapper from "@/components/ui/DialogWrapper"
import NotificationTabView from "./NotificationTabView"

const NotificationDialog = ({ isNotification }) => {
    return (
        <DialogWrapper isOpen={isNotification}>
            <NotificationTabView />
        </DialogWrapper>
    )
}

export default NotificationDialog