import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from '@/components/ui/Image';

type Member = {
  _id: string;
  name: string;
  avatar?: string | null;
  isAdmin?: boolean;
};

type CreatorLeaveDialogProps = {
  isOpen: boolean;
  members: Member[];
  onConfirm: (newCreatorId?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

const DiceIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm2.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm9 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden>
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    className={`h-4 w-4 fill-none stroke-current stroke-[1.75] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
  </svg>
);

const RANDOM_ID = '__random__';

type Row = { id: string; label: string; avatar?: string | null; isRandom?: boolean; isAdmin?: boolean };

/** Renders the leading icon for a row — dice for random, avatar for member */
const RowAvatar = ({ row, highlighted }: { row: Row; highlighted: boolean }) => {
  if (row.isRandom) {
    return (
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
          highlighted
            ? 'border-green/40 bg-green/15 text-green'
            : 'border-white/12 bg-white/6 text-body-300'
        }`}
      >
        <DiceIcon />
      </span>
    );
  }
  return (
    <span
      className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 transition-all duration-200 ${
        highlighted ? 'border-green' : 'border-white/10'
      }`}
    >
      <Image
        src={row.avatar}
        alt={row.label}
        className="h-full w-full object-cover"
        displayWidth={64}
        showLoading={false}
      />
    </span>
  );
};

const CreatorLeaveDialog = ({
  isOpen,
  members,
  onConfirm,
  onCancel,
  isLoading = false,
}: CreatorLeaveDialogProps) => {
  const titleId = useId();
  const [entered, setEntered] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(RANDOM_ID);
  const [listOpen, setListOpen] = useState(false);

  // Open/close lifecycle — reset state when dialog closes
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(frame);
      setEntered(false);
      setSelectedId(RANDOM_ID);
      setListOpen(false);
    };
  }, [isOpen]);

  // Escape key: collapse list first, then close dialog
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (listOpen) setListOpen(false);
        else onCancel();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, listOpen, onCancel]);

  if (!isOpen) return null;

  const rows: Row[] = [
    { id: RANDOM_ID, label: 'Pick randomly', isRandom: true },
    ...members.map((m) => ({ id: m._id, label: m.name, avatar: m.avatar, isAdmin: m.isAdmin })),
  ];

  const selectedRow = rows.find((r) => r.id === selectedId) ?? rows[0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setListOpen(false); // collapse after picking
  };

  const handleConfirm = () => {
    onConfirm(selectedId === RANDOM_ID ? undefined : selectedId);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-80 flex items-end justify-center p-4 sm:items-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Dismiss"
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onCancel}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-background-alt shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {/* Top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,80,80,0.18),transparent_70%)]" />

        {/* Header */}
        <div className="relative px-5 pb-3 pt-6 text-center">
          <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-red/20 bg-red/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-red stroke-[1.75]" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
          </div>
          <h2 id={titleId} className="text-base font-semibold text-white">
            Leave Group
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-body-300">
            You&apos;re the creator. Who takes ownership when you leave?
          </p>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/6" />

        {/* Selection area */}
        <div className="relative">
          {/* Summary row — always visible, toggles the list */}
          <button
            type="button"
            onClick={() => setListOpen((o) => !o)}
            className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors ${
              listOpen ? 'bg-white/5' : 'hover:bg-white/3'
            }`}
            aria-expanded={listOpen}
          >
            <RowAvatar row={selectedRow} highlighted />

            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-body-400">
                New owner
              </span>
              <span className="block truncate text-sm font-semibold text-white">
                {selectedRow.isRandom ? 'Pick randomly' : selectedRow.label}
              </span>
            </span>

            {/* Chevron badge */}
            <span
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                listOpen
                  ? 'border-white/15 bg-white/8 text-white'
                  : 'border-white/10 bg-white/5 text-body-400'
              }`}
            >
              {listOpen ? 'Close' : 'Change'}
              <ChevronIcon open={listOpen} />
            </span>
          </button>

          {/* Collapsible list — CSS grid trick for smooth height animation */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ gridTemplateRows: listOpen ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              {/* Separator inside collapse */}
              <div className="mx-5 h-px bg-white/6" />

              <div className="max-h-52 overflow-y-auto overscroll-contain scrollbar-hide">
                {rows.map((row, index) => {
                  const isSelected = selectedId === row.id;
                  const isLast = index === rows.length - 1;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => handleSelect(row.id)}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                        isSelected ? 'bg-white/5' : 'hover:bg-white/3'
                      } ${!isLast ? 'border-b border-white/5' : ''}`}
                    >
                      <RowAvatar row={row} highlighted={isSelected} />

                      <span className="min-w-0 flex-1 overflow-hidden">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`truncate text-sm font-medium transition-colors ${
                              isSelected ? 'text-white' : 'text-body-700'
                            }`}
                          >
                            {row.label}
                          </span>
                          {row.isAdmin && (
                            <span className="shrink-0 ml-1 rounded-md border border-blue/30 bg-blue/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue">
                              Admin
                            </span>
                          )}
                        </span>
                        {row.isRandom && (
                          <span className="text-[11px] font-normal text-body-400">
                            system picks
                          </span>
                        )}
                      </span>

                      {/* Checkmark */}
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-150 ${
                          isSelected
                            ? 'border-green bg-green text-white'
                            : 'border-white/15 bg-transparent text-transparent'
                        }`}
                      >
                        <CheckIcon />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/6" />

        {/* Actions */}
        <div className="relative px-5 py-4">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red text-sm font-semibold text-white transition hover:bg-red/90 disabled:opacity-60"
          >
            {isLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Leave Group
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="mt-3 w-full text-center text-sm text-body-300 transition hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CreatorLeaveDialog;
