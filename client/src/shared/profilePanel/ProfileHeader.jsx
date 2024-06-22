import NotificationIcon from "@/components/icons/Notification";
import Dropdown from "@/components/ui/Dropdown";
import { useState, useEffect, useRef } from "react";
import NotificationDialog from "../notificationDialog/NotificationDialog";
import toast from "react-hot-toast";
import { postRequest } from "@/utils/api";
import { useDispatch, useSelector } from "react-redux";
import { userNotExist } from "@/redux/reducers/auth";
import LeaveGroupIcon from "@/components/icons/LeaveGroup";

const ProfileHeader = () => {
    const [isNotification, setIsNotification] = useState(false);
    const notificationRef = useRef(null);
    const iconRef = useRef(null);

    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)

    const userName = user.name.split(' ')[0]

    console.log(user)
    const handleLogout = async () => {
        try {
            const res = await postRequest('/auth/signOut')
            dispatch(userNotExist())
            toast.success(res.message)
        } catch (error) {
            toast.error(error.message)
        }
    };

    const handleNotificationToggle = () => setIsNotification(prev => !prev);

    const handleClickOutside = (e) => {
        if (
            notificationRef.current && !notificationRef.current.contains(e.target) &&
            iconRef.current && !iconRef.current.contains(e.target)
        ) {
            setIsNotification(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const options = [
        { label: 'Logout', Icon: LeaveGroupIcon, handler: handleLogout },
    ];

    return (
        <div className="relative">
            <div className="flex justify-between items-center p-4">
                <div
                    ref={iconRef}
                    className="relative border border-border rounded-lg bg-primary p-1 cursor-pointer"
                    onClick={handleNotificationToggle}
                >
                    <NotificationIcon className={`hover:stroke-body ${isNotification && 'stroke-body'}`} />
                    {true && <div className="absolute -right-1 -top-1 w-3 h-3 rounded-full border-2 border-red-dark bg-red animate-pulse"></div>}
                </div>

                <div className="flex relative items-center">
                    <div className="w-10 h-10 overflow-hidden border-2 border-primary rounded-full absolute z-10 -left-6 bottom">
                        <img
                            src={user.avatar.url}
                            alt={user.name}
                            className="w-full object-cover"
                        />
                    </div>
                    <Dropdown options={options} name={userName} />
                </div>
            </div>

            {isNotification && (
                <div ref={notificationRef}>
                    <NotificationDialog isNotification={isNotification} />
                </div>
            )}
        </div>
    );
};

export default ProfileHeader;
