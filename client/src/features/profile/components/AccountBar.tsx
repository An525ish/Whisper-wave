import NotificationIcon from '@/shared/components/icons/Notification';
import PencilIcon from '@/shared/components/icons/Pencil';
import Dropdown from '@/shared/components/ui/Dropdown';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import NotificationDialog from '@/features/notifications/components/NotificationDialog';
import toast from 'react-hot-toast';
import { useSignOutMutation } from '@/features/chat/hooks';
import LeaveGroupIcon from '@/shared/components/icons/LeaveGroup';
import { getFirstName } from '@/shared/utils/helper';
import { useAuthStore } from '@/features/auth/store';
import { useNotificationsStore } from '@/features/notifications/store';
import { useProfileUiStore } from '@/features/profile/store';
import { useLocation } from 'react-router-dom';

type AccountBarProps = {
  className?: string;
  /** full = both; account = avatar menu; notification = bell only */
  variant?: 'full' | 'account' | 'notification' | 'compact';
  overlayClassName?: string;
  /** search = match Searchbar height (h-11); md = standard control */
  notificationSize?: 'md' | 'search';
};

/** Notifications + account menu — profile column and list chrome. */
const AccountBar = ({
  className = '',
  variant = 'full',
  overlayClassName = 'absolute inset-0 z-20',
  notificationSize = 'md',
}: AccountBarProps) => {
  const [isNotification, setIsNotification] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();

  const totalNotificationCount = useNotificationsStore(
    (s) => s.totalNotificationCount,
  );
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

  // Close the panel when navigating into a chat (e.g. from a notification link).
  useEffect(() => {
    setIsNotification(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isNotification || !isFullscreenOverlay) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isNotification, isFullscreenOverlay]);

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

  const handleEditProfile = () => {
    openSelfProfile();
  };

  const handleNotificationToggle = () => {
    setIsNotification((prev) => !prev);
  };

  useEffect(() => {
    if (isFullscreenOverlay) return;

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
  }, [isFullscreenOverlay]);

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
      className={`relative grid cursor-pointer place-items-center rounded-full border border-border bg-primary transition active:bg-primary/70 ${
        notificationSize === 'search' ? 'h-11 w-11' : 'h-10 w-10'
      }`}
      onClick={handleNotificationToggle}
      aria-label="Notifications"
      aria-expanded={isNotification}
    >
      <NotificationIcon
        className={`h-5 w-5 text-body-300 ${isNotification ? 'text-body' : ''}`}
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
    isNotification && showNotification ? (
      <div ref={notificationRef} className={overlayClassName}>
        <NotificationDialog
          isNotification={isNotification}
          onClose={() => setIsNotification(false)}
          variant={isFullscreenOverlay ? 'fullscreen' : 'panel'}
        />
      </div>
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

      {isFullscreenOverlay && notificationOverlay
        ? createPortal(notificationOverlay, document.body)
        : notificationOverlay}
    </>
  );
};

export default AccountBar;
