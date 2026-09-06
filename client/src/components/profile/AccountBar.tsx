import NotificationIcon from '@/components/ui/icons/Notification';
import PencilIcon from '@/components/ui/icons/Pencil';
import Dropdown from '@/components/ui/Dropdown';
import { useState, useEffect, useRef } from 'react';
import NotificationDialog from '@/components/notifications/NotificationDialog';
import toast from 'react-hot-toast';
import { useSignOutMutation } from '@/hooks/auth';
import LeaveGroupIcon from '@/components/ui/icons/LeaveGroup';
import { getFirstName } from '@/utils/helpers';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore, selectTotalNotificationCount } from '@/stores/notifications';
import { useProfileUiStore } from '@/stores/profile';
import { useLocation } from 'react-router-dom';

type AccountBarProps = {
  className?: string;
  /** full = both; account = avatar menu; notification = bell only */
  variant?: 'full' | 'account' | 'notification' | 'compact';
  overlayClassName?: string;
  /** Override bell button chrome (e.g. match chat header menu buttons). */
  notificationButtonClassName?: string;
  /** Override bell glyph size — stroke icons often need a bump vs filled icons. */
  notificationIconClassName?: string;
};

const defaultNotificationButtonClass =
  'relative grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-border bg-primary transition active:bg-primary/70 md:h-10 md:w-10';

const defaultNotificationIconClass = 'h-4 w-4 text-body-300 md:h-5 md:w-5';

/** Notifications + account menu — profile column and list chrome. */
const AccountBar = ({
  className = '',
  variant = 'full',
  overlayClassName = 'absolute inset-0 z-30',
  notificationButtonClassName,
  notificationIconClassName,
}: AccountBarProps) => {
  const [notificationPath, setNotificationPath] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();
  const isNotificationOpen = notificationPath === location.pathname;

  const totalNotificationCount = useNotificationsStore(selectTotalNotificationCount);
  const user = useAuthStore((s) => s.user);
  const openSelfProfile = useProfileUiStore((s) => s.openSelfProfile);
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

  const isFullscreenOverlay = overlayClassName.includes('fixed');

  const handleLogout = async () => {
    try {
      await signOut.mutateAsync();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Logout failed',
      );
    }
  };

  const handleEditProfile = () => {
    openSelfProfile();
  };

  const handleNotificationToggle = () => {
    setNotificationPath((prev) =>
      prev === location.pathname ? null : location.pathname,
    );
  };

  useEffect(() => {
    if (isFullscreenOverlay || !isNotificationOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(e.target as Node)
      ) {
        setNotificationPath(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFullscreenOverlay, isNotificationOpen]);

  const options = [
    {
      label: 'Edit profile',
      Icon: PencilIcon,
      handler: handleEditProfile,
    },
    { label: 'Logout', Icon: LeaveGroupIcon, handler: handleLogout },
  ];

  const notificationButton = (
    <button
      type="button"
      ref={iconRef}
      className={notificationButtonClassName ?? defaultNotificationButtonClass}
      onClick={handleNotificationToggle}
      aria-label="Notifications"
      aria-expanded={isNotificationOpen}
    >
      <NotificationIcon
        className={`${notificationIconClassName ?? defaultNotificationIconClass} ${
          isNotificationOpen ? 'text-body' : ''
        }`}
      />
      {totalNotificationCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-red-dark bg-red" />
      ) : null}
    </button>
  );

  const accountMenu = (
    <Dropdown
      options={options}
      name={userName}
      avatarUrl={avatarUrl}
      size={variant === 'full' ? 'md' : 'sm'}
    />
  );

  const notificationOverlay =
    isNotificationOpen && showNotification ? (
      isFullscreenOverlay ? (
        <NotificationDialog
          isNotification={isNotificationOpen}
          onClose={() => setNotificationPath(null)}
          variant="fullscreen"
        />
      ) : (
        <div ref={notificationRef} className={overlayClassName}>
          <NotificationDialog
            isNotification={isNotificationOpen}
            onClose={() => setNotificationPath(null)}
            variant="panel"
          />
        </div>
      )
    ) : null;

  return (
    <>
      <div className={`relative flex w-full shrink-0 items-center ${className}`}>
        {variant === 'full' ? (
          <div className="flex w-full items-center justify-between gap-3">
            {notificationButton}
            {accountMenu}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {showNotification ? notificationButton : null}
            {showAccount ? accountMenu : null}
          </div>
        )}
      </div>

      {notificationOverlay}
    </>
  );
};

export default AccountBar;
