import NotificationIcon from "@/components/icons/Notification";
import Dropdown from "@/components/ui/Dropdown"
import { useState } from "react";

const ProfileHeader = () => {
    const [isNotification, setIsNotification] = useState(false)
    const handleLogout = () => {
        console.log('Option 1 selected');
    };

    const handleNotificationToggle = () => setIsNotification(prev => !prev)

    const options = [
        { label: 'Logout', handler: handleLogout },
    ];

    return (
        <div className="relative">
            <div className="flex justify-end gap-16 items-center p-4">
                <div
                    className="relative border border-border rounded-lg bg-primary p-1 cursor-pointer"
                    onClick={handleNotificationToggle}>
                    <NotificationIcon className={'hover:stroke-body'} />
                    {true && <div className="absolute -right-1 -top-1 w-3 h-3 rounded-full border-2 border-red-dark bg-red animate-pulse"></div>}
                </div>

                <div className="flex relative items-center">
                    <div className="w-10 h-10 overflow-hidden rounded-full absolute z-10 -left-6 bottom">
                        <img
                            src="https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250"
                            alt=""
                            className=""
                        />
                    </div>
                    <Dropdown options={options} name={'name'} />
                </div>
            </div>
        </div>
    )
}

export default ProfileHeader