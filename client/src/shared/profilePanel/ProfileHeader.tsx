import NotificationIcon from '@/components/icons/Notification';
import Dropdown from '@/components/ui/Dropdown';
import { useState, useEffect, useRef } from 'react';
import NotificationDialog from '../notificationDialog/NotificationDialog';
import toast from 'react-hot-toast';
import { useSignOutMutation } from '@/features/api/hooks';
import LeaveGroupIcon from '@/components/icons/LeaveGroup';
import { getFirstName } from '@/utils/helper';
import Image from '@/components/ui/Image';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';

const ProfileHeader = () => {
  const [isNotification, setIsNotification] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);

  const totalNotificationCount = useNotificationsStore(
    (s) => s.totalNotificationCount,
  );
  const user = useAuthStore((s) => s.user);
  const signOut = useSignOutMutation();

  const { name, avatar } = user ?? {};
  const userName = getFirstName(name);
  const avatarUrl = typeof avatar === 'string' ? avatar : avatar?.url;

  const handleLogout = async () => {
    try {
      const res = await signOut.mutateAsync();
      toast.success(res.message || 'Logged out');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Logout failed';
      toast.error(message);
    }
  };

  const handleNotificationToggle = () => {
    setIsNotification((prev) => !prev);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(e.target as Node) &&
      iconRef.current &&
      !iconRef.current.contains(e.target as Node)
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
    <>
      <div className="relative shrink-0">
        <div className="flex items-center justify-between p-4">
          <div
            ref={iconRef}
            className="relative cursor-pointer rounded-lg border border-border bg-primary p-1"
            onClick={handleNotificationToggle}
          >
            <NotificationIcon
              className={`hover:stroke-body ${isNotification && 'stroke-body'}`}
            />
            {totalNotificationCount > 0 && (
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-red-dark bg-red" />
            )}
          </div>

          <div className="relative flex items-center">
            <div className="absolute -left-6 bottom z-10 h-10 w-10 overflow-hidden rounded-full border-2 border-primary">
              <Image
                src={avatarUrl}
                alt={userName}
                className="w-full object-cover"
              />
            </div>
            <Dropdown options={options} name={userName} />
          </div>
        </div>
      </div>

      {isNotification ? (
        <div ref={notificationRef} className="absolute inset-0 z-20">
          <NotificationDialog isNotification={isNotification} />
        </div>
      ) : null}
    </>
  );
};

export default ProfileHeader;
