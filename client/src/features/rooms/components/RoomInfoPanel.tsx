import { useMemo, useState } from 'react';
import { extractLinksFromText } from '@/features/chat';
import EmptyState from '@/shared/components/ui/EmptyState';
import Image from '@/shared/components/ui/Image';
import ImagesIcon from '@/shared/components/ui/icons/Images';
import LinkIcon from '@/shared/components/ui/icons/Link';
import ImageViewer from '@/shared/components/ui/image-viewer/ImageViewer';
import { RetryableMediaImage } from '@/shared/components/ui/media/RetryableMedia';
import { useRoomStore } from '../stores/roomStore';
import { initialOf, roomArtVariant } from '../utils/art';
import type { RoomMessageFrom } from '../types';
import './roomHeader.css';
import './roomInfo.css';

type Props = {
  slug: string;
  /** `column` is the standing side panel, `sheet` the bottom sheet below `lg`. */
  variant: 'column' | 'sheet';
};

const MAX_PEOPLE = 20;

const gradientOf = (color: string) =>
  `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 50%, #000))`;

const Person = ({ from, you }: { from: RoomMessageFrom; you: boolean }) => (
  <li className="rip__person">
    <span
      aria-hidden
      className="rip__pavatar"
      style={from.avatar ? undefined : { backgroundImage: gradientOf(from.color) }}
    >
      {from.avatar ? (
        <Image src={from.avatar} alt="" className="h-full w-full rounded-full object-cover" displayWidth={64} showLoading={false} />
      ) : (
        initialOf(from.alias)
      )}
    </span>
    <span className="rip__pname">
      {from.alias}
      {you && <span className="rip__you"> (you)</span>}
    </span>
    {from.role !== 'member' && <span className="rm-rolebadge">{from.role.toUpperCase()}</span>}
  </li>
);

/**
 * The room's info panel, shaped like the main chat's group profile: a big round
 * avatar, the name and a status line, then cards (rules, who is talking) and the
 * same "Photos & Multimedia" and "Links" sections. Rooms are pseudonymous and keep
 * no member list on the client, so "people" is whoever has spoken in the live thread,
 * and the shared media and links are read from the same thread.
 */
const RoomInfoPanel = ({ slug, variant }: Props) => {
  const title = useRoomStore((s) => s.title);
  const rules = useRoomStore((s) => s.rules);
  const online = useRoomStore((s) => s.online);
  const you = useRoomStore((s) => s.you);
  const messages = useRoomStore((s) => s.messages);
  const [viewing, setViewing] = useState<number | null>(null);

  const { people, photos, links } = useMemo(() => {
    const byAlias = new Map<string, RoomMessageFrom>();
    const media: Array<{ _id: string; url: string; name: string; fileType: 'image' }> = [];
    const seen = new Set<string>();
    const found: Array<{ url: string; host: string; displayUrl: string }> = [];
    for (const m of messages) {
      if (m.system || m.hidden) continue;
      byAlias.set(m.from.alias, m.from);
      if (m.media) media.push({ _id: m.id, url: m.media.url, name: 'photo', fileType: 'image' });
      for (const link of extractLinksFromText(m.text)) {
        if (seen.has(link.url)) continue;
        seen.add(link.url);
        found.push(link);
      }
    }
    return { people: [...byAlias.values()], photos: media, links: found.reverse() };
  }, [messages]);

  const shownPeople = people.slice(0, MAX_PEOPLE);
  const name = title || slug;
  const sectionTitle = 'mb-3 flex items-center gap-2 px-0.5 text-sm tracking-wide text-body-700';

  return (
    <div className={variant === 'sheet' ? 'rip rip--sheet' : 'rip'}>
      <div className={`rip__head rip__head--${variant}`}>
        <span aria-hidden className={`rm-chead__art rm-chead__art--${roomArtVariant(slug)} rip__art`}>
          <span>{initialOf(name)}</span>
        </span>
        <h2 className="rip__name">{name}</h2>
        <p className="rip__status">
          {online} {online === 1 ? 'person' : 'people'} online
        </p>
      </div>

      <div className="rip__scroll">
        <div className="rip__body">
          {you && (
            <section className="rip__card">
              <p className="rip__label">You</p>
              <ul className="rip__people">
                <Person from={you} you={false} />
              </ul>
            </section>
          )}

          {rules.length > 0 && (
            <section className="rip__card">
              <p className="rip__label">Room rules</p>
              <ul className="rip__rules">
                {rules.map((rule, i) => (
                  <li key={`${i}-${rule}`}>{rule}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rip__card">
            <p className="rip__label">
              Talking now{people.length > 0 ? ` · ${people.length}` : ''}
            </p>
            {people.length === 0 ? (
              <p className="rip__empty">Nobody has said anything yet.</p>
            ) : (
              <ul className="rip__people">
                {shownPeople.map((from) => (
                  <Person key={from.alias} from={from} you={from.alias === you?.alias} />
                ))}
              </ul>
            )}
            {people.length > MAX_PEOPLE && (
              <p className="rip__empty">+{people.length - MAX_PEOPLE} more</p>
            )}
          </section>

          <section className="rounded-2xl bg-primary/35 px-3 py-3.5">
            <p className={sectionTitle}>
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
                    onClick={() => setViewing(i)}
                    aria-label={`Open photo ${i + 1}`}
                    className="relative overflow-hidden rounded-lg p-0 ring-1 ring-border/50 transition duration-200 hover:opacity-90 hover:ring-green/40"
                  >
                    <RetryableMediaImage
                      url={photo.url}
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

          <section className="rounded-2xl bg-primary/35 px-3 py-3.5">
            <p className={sectionTitle}>
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
                    aria-label={`Open ${link.host}`}
                    className="flex w-full items-start gap-3 rounded-xl bg-background-alt/70 px-3 py-2.5 text-left ring-1 ring-border/40 transition duration-200 hover:bg-background-alt hover:ring-green/35"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background-alt ring-1 ring-border/50">
                      <LinkIcon className="h-4 w-4 stroke-body-300" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-body">{link.host}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-body-300">{link.displayUrl}</span>
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
};

export default RoomInfoPanel;
