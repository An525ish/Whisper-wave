import NotificationTabView from "./NotificationTabView"

const NotificationPanel = ({ isNotification }) => {
    return (
        <div className={`absolute w-full z-20 rounded-xl border border-border backdrop-blur-2xl backdrop-filter backdrop-brightness-[0.85] transition-[height] ${isNotification ? 'h-[87vh] opacity-100' : 'h-0 opacity-0'}`}>
            <NotificationTabView />
        </div>
    )
}

export default NotificationPanel