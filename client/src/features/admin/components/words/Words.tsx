import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSaveWordFilterMutation, useWordFilterQuery } from '../../hooks';
import type { AdminWordCategory, AdminWordFilter } from '../../types';
import RefreshButton from '../shared/RefreshButton';
import Switch from '../shared/Switch';

type Draft = Pick<AdminWordFilter, 'enabled'> & {
  categories: Record<string, { enabled: boolean; terms: string[] }>;
};

const toDraft = (data: AdminWordFilter): Draft => ({
  enabled: data.enabled,
  categories: Object.fromEntries(data.categories.map((c) => [c.id, { enabled: c.enabled, terms: c.terms }])),
});

const CategoryCard = ({
  cat,
  value,
  masterOn,
  onChange,
}: {
  cat: AdminWordCategory;
  value: { enabled: boolean; terms: string[] };
  masterOn: boolean;
  onChange: (next: { enabled: boolean; terms: string[] }) => void;
}) => {
  const [input, setInput] = useState('');
  const add = () => {
    const term = input.trim();
    if (!term) return;
    if (!value.terms.some((t) => t.toLowerCase() === term.toLowerCase())) onChange({ ...value, terms: [...value.terms, term] });
    setInput('');
  };
  const active = masterOn && value.enabled;

  return (
    <section className={`rounded-2xl border border-border/50 bg-primary/35 p-4 ${masterOn ? '' : 'opacity-60'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-body">
            {cat.label}
            {cat.severe && (
              <span className="ml-2 rounded-full bg-red/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red">
                also reports
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-xs text-body-300">
            {active ? `${value.terms.length} blocked` : 'Off, nothing here is blocked'}
          </p>
        </div>
        <Switch on={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} label={`Block ${cat.label}`} />
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {value.terms.map((term) => (
          <li key={term} className="flex items-center gap-1 rounded-full bg-white/[0.06] py-1 pl-2.5 pr-1 text-xs text-body">
            {term}
            <button
              type="button"
              aria-label={`Remove ${term}`}
              onClick={() => onChange({ ...value, terms: value.terms.filter((t) => t !== term) })}
              className="grid h-4 w-4 place-items-center rounded-full text-body-300 hover:bg-white/10 hover:text-body"
            >
              ×
            </button>
          </li>
        ))}
        {value.terms.length === 0 && <li className="text-xs text-body-700">No words.</li>}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={input}
          maxLength={60}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a word or phrase"
          aria-label={`Add a word to ${cat.label}`}
          className="min-w-0 flex-1 rounded-xl border border-border/60 bg-white/[0.03] px-3 py-2 text-sm text-body outline-none placeholder:text-body-700 focus:border-green/50"
        />
        <button type="button" onClick={add} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-body hover:bg-white/15">
          Add
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...value, terms: [...cat.defaultTerms] })}
          className="rounded-full px-3 py-2 text-xs font-medium text-body-300 hover:text-body"
        >
          Reset to built-in
        </button>
      </div>
    </section>
  );
};

/**
 * Blocked words: one list shared by Whisper and Rooms. A master switch, a switch per
 * category, and each category's words are editable. Changes apply on Save, with no deploy.
 */
const Words = () => {
  const { data, isLoading, isError, refetch } = useWordFilterQuery();
  const save = useSaveWordFilterMutation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [seen, setSeen] = useState<AdminWordFilter | undefined>(undefined);

  // Start (and restart after a save) from what the server holds, adjusted during render.
  if (data && data !== seen) {
    setSeen(data);
    setDraft(toDraft(data));
  }

  const dirty = data && draft ? JSON.stringify(draft) !== JSON.stringify(toDraft(data)) : false;

  const onSave = () => {
    if (!draft) return;
    save.mutate(draft, {
      onSuccess: () => toast.success('Saved. Live now.'),
      onError: () => toast.error('Could not save. Try again.'),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
          <h1 className="mt-1 font-semibold text-3xl leading-none tracking-tight text-body sm:text-4xl">Blocked words</h1>
          <p className="mt-2 text-sm text-body-300">One list for Whisper and Rooms. Edits apply as soon as you save.</p>
        </div>
        <RefreshButton />
      </header>

      {isLoading && <div aria-label="Loading" className="h-40 animate-pulse rounded-2xl bg-white/5 motion-reduce:animate-none" />}
      {isError && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm font-medium text-body">Couldn&apos;t load the settings</p>
          <button type="button" onClick={() => void refetch()} className="rounded-full border border-border/50 bg-primary/35 px-4 py-2 text-xs font-semibold text-body-300 hover:text-body">
            Try again
          </button>
        </div>
      )}

      {data && draft && (
        <>
          <section className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-primary/35 p-4">
            <div>
              <h2 className="text-sm font-semibold text-body">Block words</h2>
              <p className="mt-0.5 text-xs text-body-300">
                {draft.enabled
                  ? 'On. Messages with a listed word are not delivered.'
                  : 'Off. No word is blocked in Whisper or Rooms, including the child-safety and threat lists.'}
              </p>
            </div>
            <Switch on={draft.enabled} onChange={(enabled) => setDraft({ ...draft, enabled })} label="Block words everywhere" />
          </section>

          <div
            role="region"
            aria-label="Word categories"
            tabIndex={0}
            className="flex max-h-[max(16rem,calc(100dvh-20rem))] flex-col gap-3 overflow-y-auto overscroll-contain rounded-2xl border border-border/50 bg-white/[0.02] p-3 focus-visible:outline-2 focus-visible:outline-green/50"
          >
            {data.categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                value={draft.categories[cat.id] ?? { enabled: true, terms: [] }}
                masterOn={draft.enabled}
                onChange={(next) => setDraft({ ...draft, categories: { ...draft.categories, [cat.id]: next } })}
              />
            ))}
          </div>

          <div className="sticky bottom-3 flex justify-end gap-2">
            <button
              type="button"
              disabled={!dirty || save.isPending}
              onClick={() => setDraft(toDraft(data))}
              className="rounded-full border border-border/50 bg-primary/80 px-4 py-2 text-sm font-medium text-body-300 hover:text-body disabled:opacity-40"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={!dirty || save.isPending}
              onClick={onSave}
              className="rounded-full bg-green px-5 py-2 text-sm font-semibold text-black disabled:opacity-40"
            >
              {save.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Words;
