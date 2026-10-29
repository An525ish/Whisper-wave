import { useRevealedPhotos } from '../stores/revealedPhotosStore';
import { useState } from 'react';
import { RetryableMediaImage } from '@/shared/components/ui/media/RetryableMedia';
import EmptyState from '@/shared/components/ui/EmptyState';
import ImagesIcon from '@/shared/components/ui/icons/Images';
import LinkIcon from '@/shared/components/ui/icons/Link';
import ImageViewer from '@/shared/components/ui/image-viewer/ImageViewer';
import type { ThreadPhoto } from '../utils/threadLinks';
import AnonProfileHead from './AnonProfileHead';
import SparkDeck from './SparkDeck';
import { FRESH_THREAD_MESSAGES } from '../constants';
import { formatThreadDuration } from '../utils/threadSummary';
import { vibeTagLabel } from '../utils/vibeTag';
import type {
  ReactionTally,
  Spark,
  ThreadLink,
  ThreadStats,
  VibeOverlap,
  VibeTag,
} from '../types';
import './anonPartnerPanel.css';
import './anonPartnerCards.css';

type Props = {
  /** `column` is a standing side panel, `sheet` the bottom sheet below `lg`. */
  variant: 'column' | 'sheet';
  name: string;
  tags: VibeTag[];
  overlap: VibeOverlap;
  sparks: Spark[];
  /** Null when there is no live thread. */
  stats: ThreadStats | null;
  links: ThreadLink[];
  /** Photos from the thread, oldest first. */
  photos: ThreadPhoto[];
  reactions: ReactionTally[];
  typing: boolean;
  left: boolean;
  onPickSpark: (text: string) => void;
};

const statusLine = (typing: boolean, left: boolean, stats: ThreadStats | null): string => {
  if (left) return 'Left the chat';
  if (typing) return 'typing…';
  if (stats && stats.minutes >= 1) return `${formatThreadDuration(stats.minutes * 60_000)} together`;
  return 'In the void with you';
};

/**
 * The other person.
 *
 * Everything here is what an anonymous stranger can honestly be: an alias, the
 * vibes they chose, and what the two of you have done together — nothing is
 * fetched (see `usePartnerProfile`). Ordered by what you would act on: who they
 * are, then a one-tap opener, then the thread's history.
 */
export default function AnonPartnerPanel({
  variant,
  name,
  tags,
  overlap,
  sparks,
  stats,
  links,
  photos,
  reactions,
  typing,
  left,
  onPickSpark,
}: Props) {
  const [viewing, setViewing] = useState<number | null>(null);
  const revealedIds = useRevealedPhotos((s) => s.ids);
  const reveal = useRevealedPhotos((s) => s.reveal);
  const total = stats ? stats.myMessages + stats.theirMessages : 0;
  const sharedCount = overlap.shared.length;

  return (
    <div className={variant === 'sheet' ? 'acp acp--sheet' : 'acp'}>
      <AnonProfileHead
        name={name}
        status={statusLine(typing, left, stats)}
        live={!left}
        variant={variant}
      />

      <div className="acp__scroll">
        <div className="acp__body">
          {/* ── Their vibes ─────────────────────────────────────────── */}
          <section className="acp__card">
            <p className="acp__label">{name}&rsquo;s vibes</p>
            <div className="apn-vibes">
              {sharedCount > 0 && (
                <div className="apn-group">
                  <p className="apn-group__label">{sharedCount} in common</p>
                  <div className="apn-chips">
                    {overlap.shared.map((tag) => (
                      <span key={tag} className="apn-chip apn-chip--shared">{vibeTagLabel(tag)}</span>
                    ))}
                  </div>
                </div>
              )}
              {overlap.onlyTheirs.length > 0 && (
                <div className="apn-group">
                  <p className="apn-group__label">{sharedCount > 0 ? `Only ${name}` : 'Theirs'}</p>
                  <div className="apn-chips">
                    {overlap.onlyTheirs.map((tag) => (
                      <span key={tag} className="apn-chip">{vibeTagLabel(tag)}</span>
                    ))}
                  </div>
                </div>
              )}
              {tags.length === 0 && (
                <p className="apn-empty">{name} kept their vibes secret.</p>
              )}
            </div>
          </section>

          {/* ── Sparks ──────────────────────────────────────────────── */}
          {!left && (
            <section className="acp__card">
              <SparkDeck
                sparks={sparks}
                fresh={total < FRESH_THREAD_MESSAGES}
                disabled={left}
                onPick={onPickSpark}
              />
            </section>
          )}

          {/* ── This thread ─────────────────────────────────────────── */}
          {stats && (
            <section className="acp__card">
              <p className="acp__label">This thread</p>
              {total === 0 ? (
                <p className="apn-empty">
                  {left ? 'No messages were sent.' : 'Nothing said yet — break the ice.'}
                </p>
              ) : (
                <>
                  <div
                    className="apn-balance"
                    role="img"
                    aria-label={`You sent ${stats.myMessages} messages, ${name} sent ${stats.theirMessages}`}
                  >
                    <span className="apn-balance__seg apn-balance__seg--me" style={{ flexGrow: stats.myMessages }} />
                    <span className="apn-balance__seg apn-balance__seg--them" style={{ flexGrow: stats.theirMessages }} />
                  </div>
                  <p className="apn-balance__legend">
                    <span><i className="apn-dot apn-dot--me" aria-hidden />You <b className="tabular-nums">{stats.myMessages}</b></span>
                    <span><i className="apn-dot apn-dot--them" aria-hidden />{name} <b className="tabular-nums">{stats.theirMessages}</b></span>
                  </p>
                </>
              )}

              {reactions.length > 0 && (
                <ul className="apn-reacts">
                  {reactions.map((row) => (
                    <li key={row.reaction} className="apn-react">
                      <span className="apn-react__glyph" aria-hidden>{row.reaction}</span>
                      <span className="apn-react__text">
                        <span className="apn-react__who">
                          {row.me > 0 && `you ${row.me}`}
                          {row.me > 0 && row.them > 0 && ' · '}
                          {row.them > 0 && `${name} ${row.them}`}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ── Photos & Multimedia (same section as the main chat's profile) ── */}
          <section className="rounded-2xl bg-primary/35 px-3 py-3.5">
            <p className="mb-3 flex items-center gap-2 px-0.5 text-sm tracking-wide text-body-700">
              <ImagesIcon className="h-4 w-4 shrink-0 fill-body-300 stroke-body-300" /> Photos & Multimedia
            </p>
            {photos.length === 0 ? (
              <EmptyState
                className="py-4"
                imageSrc="/images/no-media.svg"
                imageAlt="no-media"
                imageClassName="w-16 opacity-45"
                titleClassName="mt-2 text-center text-xs text-body-300"
                title="No media yet"
              />
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {photos.map((photo, i) => (
                  <button
                    type="button"
                    key={photo._id}
                    onClick={() => (photo.mine || revealedIds[photo._id] ? setViewing(i) : reveal(photo._id))}
                    aria-label={`Open photo ${i + 1}`}
                    // Blurred until revealed (here or in the chat); the first tap reveals, the next opens.
                    className={`relative overflow-hidden rounded-lg p-0 ring-1 ring-border/50 transition duration-200 hover:opacity-90 hover:ring-green/40${photo.mine || revealedIds[photo._id] ? '' : ' [&_img]:scale-110 [&_img]:blur-[14px]'}`}
                  >
                    <RetryableMediaImage
                      url={photo.url ?? ''}
                      alt="photo"
                      wrapperClassName="aspect-5/4 w-full rounded-lg"
                      className="h-full w-full bg-primary object-cover"
                      fallbackIconClassName="h-10 w-10"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
          {viewing !== null && (
            <ImageViewer mediaFiles={photos} initialIndex={viewing} onClose={() => setViewing(null)} />
          )}

          {/* ── Links (same section as the main chat's profile) ── */}
          <section className="rounded-2xl bg-primary/35 px-3 py-3.5">
            <p className="mb-3 flex items-center gap-2 px-0.5 text-sm tracking-wide text-body-700">
              <LinkIcon className="h-4 w-4 shrink-0 stroke-body-300" /> Links
            </p>
            {links.length === 0 ? (
              <EmptyState
                className="py-4"
                imageSrc="/images/no-link.svg"
                imageAlt="no links"
                imageClassName="w-20 opacity-45"
                titleClassName="mt-2 text-center text-xs text-body-300"
                title="No links yet"
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                {links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={`Open ${link.host}, shared by ${link.from === 'me' ? 'you' : name}`}
                    className="flex w-full items-start gap-3 rounded-xl bg-background-alt/70 px-3 py-2.5 text-left ring-1 ring-border/40 transition duration-200 hover:bg-background-alt hover:ring-green/35"
                  >
                    {/* No link-preview fetch here: that would send the URL to our server. */}
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background-alt ring-1 ring-border/50">
                      <LinkIcon className="h-4 w-4 stroke-body-300" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-body">{link.host}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-body-300">{link.url}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
