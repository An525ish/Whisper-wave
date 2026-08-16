import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from '@/components/ui/Image';
import ConfirmationModal from '@/components/ui/modal/confirmation-modal/ConfirmationModal';
import TrashIcon from '@/components/ui/icons/Trash';
import { GROUP_DETAIL_PANEL_TRANSITION_MS } from '@/constants/admin/groups';
import { useDeleteAdminGroupMutation, useRemoveGroupMemberMutation } from '@/hooks/admin';
import type { AdminGroupMember, AdminGroupRow } from '@/types/admin';
import { formatGroupCreated } from '@/utils/admin/groups';

type GroupDetailPanelProps = {
  group: AdminGroupRow;
  onClose: () => void;
};

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

const GroupDetailPanel = ({ group, onClose }: GroupDetailPanelProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<AdminGroupMember | null>(null);
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<AdminGroupMember[]>(group.members ?? []);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { mutate: deleteGroup, isPending: deleting } = useDeleteAdminGroupMutation();
  const { mutate: removeMember, isPending: removing } = useRemoveGroupMemberMutation();

  const creator = group.creator;

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
    closeTimer.current = setTimeout(onClose, GROUP_DETAIL_PANEL_TRANSITION_MS);
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
            className="pointer-events-none absolute -left-10 top-0 h-40 w-56 rounded-full bg-gold/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-6 bottom-0 h-32 w-40 rounded-full bg-blue/10 blur-3xl"
            aria-hidden
          />

          <div className="relative flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              Group profile
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
              <div className="absolute inset-0 scale-110 rounded-2xl bg-gold/20 blur-xl" aria-hidden />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-gold/25 to-gold/5 ring-[3px] ring-gold/25 ring-offset-2 ring-offset-background">
                <span className="font-display text-3xl font-bold text-gold">
                  {(group.name ?? 'G')[0].toUpperCase()}
                </span>
              </div>
            </div>

            <h2 className="mt-5 font-display text-2xl leading-tight tracking-tight text-body">
              {group.name ?? '—'}
            </h2>
            {group.bio ? (
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-body-300/70">{group.bio}</p>
            ) : null}

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/45 bg-primary/25 px-3 py-1.5 text-xs font-medium text-blue">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-y-contain px-6 pb-6 scrollbar-hide">
          <div className="overflow-hidden rounded-2xl border border-border/35 bg-linear-to-b from-primary/30 via-primary/15 to-primary/5 shadow-sm">
            {creator ? (
              <div className="flex items-center gap-3 border-b border-border/25 px-4 py-4 sm:px-5">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-border/40">
                  <Image
                    src={creator.avatar?.url}
                    alt={creator.name ?? ''}
                    className="h-full w-full object-cover"
                    displayWidth={80}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-body-300/45">
                    Creator
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-body">{creator.name ?? '—'}</p>
                  <p className="text-xs text-body-300/55">@{creator.username ?? '—'}</p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 divide-x divide-border/25 border-b border-border/25">
              <div className="px-4 py-4 text-center sm:px-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-body-300/45">
                  Created
                </p>
                <p className="mt-2 font-display text-lg leading-tight text-body">
                  {formatGroupCreated(group.createdAt)}
                </p>
              </div>
              <div className="px-4 py-4 text-center sm:px-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-body-300/45">
                  Members
                </p>
                <p className="mt-2 font-display text-lg leading-tight tabular-nums text-blue">
                  {members.length}
                </p>
              </div>
            </div>

            <div className="border-t border-border/25 bg-background/25 px-4 py-3.5 sm:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-body-300/40">
                Group ID
              </p>
              <p className="mt-2 break-all rounded-lg border border-border/25 bg-primary/20 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-body-300/75 select-all">
                {group._id}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg leading-none tracking-tight text-body">Members</h3>
              <span className="rounded-full border border-border/40 bg-primary/25 px-2.5 py-1 text-[10px] font-semibold text-body-300">
                {members.length}
              </span>
            </div>

            <div className="space-y-1">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-primary/20"
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-border/40">
                    <Image
                      src={member.avatar?.url}
                      alt={member.name ?? ''}
                      className="h-full w-full object-cover"
                      displayWidth={80}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-body">{member.name ?? '—'}</p>
                    <p className="truncate text-xs text-body-300/55">@{member.username ?? '—'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveMemberTarget(member)}
                    disabled={removing}
                    className="rounded-lg p-2 text-body-300/40 transition hover:bg-red/10 hover:text-red disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Remove from group"
                    aria-label={`Remove ${member.name ?? 'member'}`}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <p className="py-8 text-center text-sm text-body-300/60">No members in this group</p>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-border/40 bg-background/80 p-5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red/25 bg-red/8 text-sm font-medium text-red transition hover:bg-red/12 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            {deleting ? 'Deleting…' : 'Delete group'}
          </button>
        </div>
      </aside>

      {removeMemberTarget && (
        <ConfirmationModal
          variant="danger"
          title="Remove from group?"
          description={`@${removeMemberTarget.username} will be removed from "${group.name}".`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onClose={() => setRemoveMemberTarget(null)}
          handleConfirmationModal={({ accept }) => {
            const target = removeMemberTarget;
            setRemoveMemberTarget(null);
            if (accept) {
              setMembers((prev) => prev.filter((member) => member._id !== target._id));
              removeMember({ groupId: group._id, userId: target._id });
            }
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmationModal
          variant="danger"
          title="Delete this group?"
          description={`"${group.name}" and its messages will be permanently removed.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onClose={() => setConfirmDelete(false)}
          handleConfirmationModal={({ accept }) => {
            setConfirmDelete(false);
            if (accept) deleteGroup(group._id, { onSuccess: requestClose });
          }}
        />
      )}
    </div>,
    document.body,
  );
};

export default GroupDetailPanel;
