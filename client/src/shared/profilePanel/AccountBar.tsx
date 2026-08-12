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
import { useLocation } from 'react-router-dom';

type AccountBarProps = {
  className?: string;
  /** full = both; account = avatar menu; notification = bell only */
  variant?: 'full' | 'account' | 'notification' | 'compact';
  overlayClassName?: string;
};

/** Notifications + account menu — profile column and list chrome. */
const AccountBar = ({
  className = '',
  variant = 'full',
  overlayClassName = 'absolute inset-0 z-20',
}: AccountBarProps) => {
  const [isNotification, setIsNotification] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  const totalNotificationCount = useNotificationsStore(
    (s) => s.totalNotificationCount,
  );
  const user = useAuthStore((s) => s.user);
  const signOut = useSignOutMutation();

  const { name, avatar } = user ?? {};
  const userName = getFirstName(name);
  const avatarUrl = typeof avatar === 'string' ? avatar : avatar?.url;

  const showNotification =
    variant === 'full' ||
    variant === 'compact' ||
    variant === 'notification';
  const showAccount =
    variant === 'full' || variant === 'compact' || variant === 'account';

  // Close the sheet when navigating into a chat (e.g. from a notification link).
  useEffect(() => {
    setIsNotification(false);
  }, [location.pathname]);

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

  useEffect(() => {
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options = [
    { label: 'Logout', Icon: LeaveGroupIcon, handler: handleLogout },
  ];

  const notificationButton = (
    <div
      ref={iconRef}
      className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-border bg-primary transition active:bg-primary/70"
      onClick={handleNotificationToggle}
      role="button"
      tabIndex={0}
      aria-label="Notifications"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNotificationToggle();
        }
      }}
    >
      <NotificationIcon
        className={`hover:stroke-body ${isNotification ? 'stroke-body' : ''}`}
      />
      {totalNotificationCount > 0 ? (
        <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-red-dark bg-red" />
      ) : null}
    </div>
  );

  const accountMenu = (
    <div className="relative flex min-w-0 items-center pl-5">
      <div className="absolute left-0 z-10 h-9 w-9 overflow-hidden rounded-full border-2 border-primary">
        <Image
          src={avatarUrl}
          alt={userName}
          className="h-full w-full object-cover"
        />
      </div>
      <Dropdown options={options} name={userName} />
    </div>
  );

  return (
    <>
      <div className={`relative shrink-0 ${className}`}>
        {variant === 'full' ? (
          <div className="flex items-center justify-between gap-3">
            {notificationButton}
            <div className="relative flex min-w-0 items-center">
              <div className="absolute -left-6 bottom-0 z-10 h-10 w-10 overflow-hidden rounded-full border-2 border-primary">
                <Image
                  src={avatarUrl}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              </div>
              <Dropdown options={options} name={userName} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {showNotification ? notificationButton : null}
            {showAccount ? accountMenu : null}
          </div>
        )}
      </div>

      {isNotification && showNotification ? (
        <div ref={notificationRef} className={overlayClassName}>
          <NotificationDialog
            isNotification={isNotification}
            onClose={() => setIsNotification(false)}
          />
        </div>
      ) : null}
    </>
  );
};

export default AccountBar;
