import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from '@/components/ui/Image';
import ConfirmationModal from '@/components/ui/modal/confirmation-modal/ConfirmationModal';
import TrashIcon from '@/components/ui/icons/Trash';
import LeaveGroupIcon from '@/components/ui/icons/LeaveGroup';
import { USER_DETAIL_PANEL_TRANSITION_MS } from '@/constants/admin/users';
import {
  useAdminUserDetailQuery,
  useDeleteAdminUserMutation,
  useImpersonateMutation,
} from '@/hooks/admin';
import { presenceMeta } from '@/utils/admin/users';
import UserProfileDetails from './UserProfileDetails';

type UserDetailPanelProps = {
  userId: string;
  onClose: () => void;
};

const LiveDot = ({ className }: { className: string }) => (
  <span className={`inline-block h-2 w-2 rounded-full ${className}`} />
);

const panelMotion = (open: boolean) =>
  [
    'transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none',
    open ? 'translate-x-0' : 'translate-x-full',
  ].join(' ');

const backdropMotion = (open: boolean) =>
  [
    'transition-opacity duration-300 ease-out motion-reduce:transition-none',
    open ? 'opacity-100' : 'opacity-0',
  ].join(' ');

const UserDetailPanel = ({ userId, onClose }: UserDetailPanelProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmImpersonate, setConfirmImpersonate] = useState(false);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data, isLoading, isError, refetch } = useAdminUserDetailQuery(userId);
  const user = data?.user;
  const presence = presenceMeta(user?.lastSeen);

  const { mutate: deleteUser, isPending: deleting } = useDeleteAdminUserMutation();
  const { mutate: impersonate, isPending: impersonating } = useImpersonateMutation();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => {
      cancelAnimationFrame(frame);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const requestClose = useCallback(() => {
    setOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(onClose, USER_DETAIL_PANEL_TRANSITION_MS);
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [requestClose]);

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-stretch justify-end">
      <button
        type="button"
        className={`absolute inset-0 bg-black/55 backdrop-blur-sm ${backdropMotion(open)}`}
        aria-label="Close"
        onClick={requestClose}
      />

      <aside
        className={`relative z-10 flex h-full w-full max-w-104 flex-col border-l border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl ${panelMotion(open)}`}
      >
        <div className="relative shrink-0 overflow-hidden px-6 pb-6 pt-5">
          <div
            className="pointer-events-none absolute -left-10 top-0 h-40 w-56 rounded-full bg-blue/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-6 bottom-0 h-32 w-40 rounded-full bg-green/10 blur-3xl"
            aria-hidden
          />

          <div className="relative flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">
              Member profile
            </p>
            <button
              type="button"
              onClick={requestClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-primary/30 text-body-300 transition hover:bg-primary/50 hover:text-body"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          <div className="relative mt-8 flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-full bg-blue/20 blur-xl" aria-hidden />
              <div className="relative h-28 w-28 overflow-hidden rounded-full ring-[3px] ring-blue/25 ring-offset-2 ring-offset-background">
                {isLoading ? (
                  <div className="h-full w-full animate-pulse bg-border/25" />
                ) : (
                  <Image
                    src={user?.avatar?.url}
                    alt={user?.name ?? ''}
                    className="h-full w-full object-cover"
                    displayWidth={224}
                  />
                )}
              </div>
            </div>

            <h2 className="mt-5 font-display text-2xl leading-tight tracking-tight text-body">
              {isLoading ? (
                <span className="inline-block h-7 w-36 animate-pulse rounded bg-border/25" />
              ) : (
                (user?.name ?? '—')
              )}
            </h2>

            {!isLoading && user?.username && (
              <p className="mt-1.5 text-sm text-body-300">@{user.username}</p>
            )}

            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full border border-border/45 bg-primary/25 px-3 py-1.5 text-xs font-medium ${presence.text}`}
            >
              <LiveDot className={presence.dot} />
              {isLoading ? '…' : presence.label}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-y-contain px-6 pb-6 scrollbar-hide">
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-body-300">Couldn&apos;t load profile</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-full border border-border/50 bg-primary/35 px-4 py-2 text-xs font-semibold text-body-300 hover:text-body"
              >
                Retry
              </button>
            </div>
          ) : (
            <UserProfileDetails user={user} isLoading={isLoading} />
          )}
        </div>

        <div className="shrink-0 space-y-2.5 border-t border-border/40 bg-background/80 p-5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setConfirmImpersonate(true)}
            disabled={impersonating || isLoading || !user}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue text-sm font-semibold text-white shadow-sm shadow-blue/25 transition hover:bg-blue/90 disabled:opacity-50"
          >
            <LeaveGroupIcon className="h-4 w-4" />
            {impersonating ? 'Opening…' : 'Login as user'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting || isLoading || !user}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red/25 bg-red/8 text-sm font-medium text-red transition hover:bg-red/12 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </aside>

      {confirmImpersonate && user && (
        <ConfirmationModal
          variant="default"
          title={`Login as @${user.username}?`}
          description="Opens a new tab signed in as this user. Your admin session is safe — it uses a separate cookie."
          confirmLabel="Open new tab"
          cancelLabel="Cancel"
          onClose={() => setConfirmImpersonate(false)}
          handleConfirmationModal={({ accept }) => {
            setConfirmImpersonate(false);
            if (accept) impersonate(userId);
          }}
        />
      )}

      {confirmDelete && user && (
        <ConfirmationModal
          variant="danger"
          title="Delete this account?"
          description={`@${user.username}'s account will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onClose={() => setConfirmDelete(false)}
          handleConfirmationModal={({ accept }) => {
            setConfirmDelete(false);
            if (accept) {
              deleteUser(userId, { onSuccess: requestClose });
            }
          }}
        />
      )}
    </div>,
    document.body,
  );
};

export default UserDetailPanel;
