import { useAnonStore } from '../stores/anonStore';
import { useRevealedPhotos } from '../stores/revealedPhotosStore';
import { useState } from 'react';
import type { MediaFile } from '@/shared/types/media';
import {
  LinkPreview,
  MEDIA_TIME_CLASS,
  MESSAGE_ROW_GAP,
  META_ROW_CLASS,
  RenderAttachments,
  bubblePadding,
  extractLinksFromText,
  isLinkOnlyMessage,
} from '@/features/chat';
import ImageViewer from '@/shared/components/ui/image-viewer/ImageViewer';
import dayjs from 'dayjs';
import ReadReceipt from '@/shared/components/ui/icons/ReadReceipt';
import MessageReactionBar from './MessageReactionBar';
import { linkify } from '../utils/linkify';
import type { AnonMessage, AnonReaction } from '../types';

const MAX_PREVIEWS = 2;
const fmt = (ms: number): string => dayjs(ms).format('h:mm A');

type Props = {
  msg: AnonMessage;
  /** Every photo in the thread, so the viewer can swipe between them like the main chat. */
  photos: MediaFile[];
  /** False once the thread is over — no reacting on a dead conversation. */
  live: boolean;
  onRetry: (id: string) => void;
  onReact: (messageId: string, reaction: AnonReaction) => void;
};

/**
 * One message row. Bubble geometry, fills, radii and timestamp treatment come
 * straight from the logged-in chat (`bubble-in`/`bubble-out` + the same padding
 * contract), so moving between the two chats does not change how a message looks.
 * Links are tappable, styled like the main chat's. Spacing is padding, never
 * margin, because the virtualizer measures the row box.
 */
export default function AnonMessageBubble({
  msg,
  photos,
  live,
  onRetry,
  onReact,
}: Props) {
  const isMe = msg.from === 'me';
  const failed = isMe && msg.delivery === 'failed';
  // Strangers' photos stay blurred until tapped. Your own are never hidden.
  const shared = useRevealedPhotos((s) => Boolean(s.ids[msg.id]));
  const revealed = isMe || shared;
  const [viewing, setViewing] = useState(false);
  const seen = useAnonStore((s) => isMe && msg.sentAt <= s.readUpTo);

  // Same markup twice: invisible in the text flow to reserve the stamp's footprint
  // (so it can never sit on the last word), and absolutely positioned for real.
  const stamp = (
    <>
      <span>{fmt(msg.sentAt)}</span>
      {isMe && !failed && (
        msg.delivery === 'sending' ? (
          <span className="acr-time__state" aria-label="Sending"> ·</span>
        ) : (
          <span className="ml-2 inline-flex shrink-0 items-center" aria-label="Sent">
            <ReadReceipt read={seen} />
          </span>
        )
      )}
    </>
  );

  // Same rules as the main chat: a photo with no text carries its time on the photo
  // (dark pill); everything else gets the time at the end of the text, on EVERY message.
  const hasText = Boolean(msg.content.trim());
  const mediaOnly = Boolean(msg.image) && !hasText;
  // Link previews, same rules as the main chat. Capped at 2 so a pasted list can't
  // fan out into a pile of server fetches. Photo captions never get previews.
  const links = msg.image ? [] : extractLinksFromText(msg.content).slice(0, MAX_PREVIEWS);
  const linkOnly = links.length > 0 && isLinkOnlyMessage(msg.content);
  const showStamp = !mediaOnly && links.length === 0;
  const padding = bubblePadding(mediaOnly || linkOnly ? 'media' : msg.image ? 'mediaText' : 'text', isMe);
  const linkStamp = (
    <time
      dateTime={new Date(msg.sentAt).toISOString()}
      className={`pointer-events-none absolute bottom-1.5 right-1.5 z-10 inline-flex items-center ${MEDIA_TIME_CLASS}`}
    >
      {stamp}
    </time>
  );
  const previews = links.map((link, i) => (
    <div key={link.url} className="relative">
      <LinkPreview link={link} variant={isMe ? 'outgoing' : 'incoming'} lead={i === 0 && linkOnly} />
      {i === links.length - 1 ? linkStamp : null}
    </div>
  ));

  const canReact = live && !failed && msg.delivery !== 'sending';
  const hasReactions = Boolean(msg.reactions?.me || msg.reactions?.them);

  return (
    <div
      className={`acr-row flex w-full ${MESSAGE_ROW_GAP} ${isMe ? 'acr-row--me justify-end' : 'justify-start'}`}
    >
      {/* flex-col wrapper so reactions hang below the bubble, same as the main chat.
          With none yet, pb-4.5/-mb-4.5 reserves the hover smiley's spot without moving the row. */}
      <div
        className={`group relative z-1 flex w-fit min-w-0 max-w-[min(100%,22rem)] shrink-0 flex-col ${canReact && !hasReactions ? 'pb-4.5 -mb-4.5' : ''} ${isMe ? 'items-end self-end' : 'items-start self-start'}`}
      >
      <div
        className={[
          // `acr-bubble` is the hook the failed-state override hangs off.
          'acr-bubble min-w-0 w-fit max-w-full select-none text-left',
          isMe
            ? 'bubble-out border border-green/35 bg-green-dark/55'
            : 'bubble-in border border-border bg-primary/90',
          padding,
          failed ? 'acr-bubble--failed' : '',
          isMe ? 'acr-new-r' : 'acr-new-l',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="relative min-w-0 max-w-full">
          {msg.image && (
            // Same tile as the main chat (4:3, rounded, retry + placeholder). Strangers'
            // photos stay blurred until tapped; your own never are.
            <button
              type="button"
              className={`acr-img block w-fit max-w-full overflow-hidden rounded-2xl text-left${hasText ? ' mb-1.5' : ''}${revealed ? '' : ' acr-img--hidden'}`}
              onClick={() => (revealed ? setViewing(true) : useRevealedPhotos.getState().reveal(msg.id))}
              aria-label={revealed ? 'Open photo' : 'Show photo'}
            >
              <RenderAttachments
                fileType="image"
                url={msg.image.url}
                name="photo"
                isUploading={isMe && msg.delivery === 'sending'}
                overlay={
                  mediaOnly ? (
                    <time
                      dateTime={new Date(msg.sentAt).toISOString()}
                      className={`pointer-events-none absolute bottom-0 right-0.5 z-2 inline-flex items-center ${MEDIA_TIME_CLASS}`}
                    >
                      {stamp}
                    </time>
                  ) : null
                }
              />
              {!revealed && <span className="acr-img__veil">Tap to view</span>}
            </button>
          )}
          {linkOnly && <div className="relative min-w-0 w-full px-0.5">{previews}</div>}
          {!mediaOnly && !linkOnly && (
          <div className={msg.image ? 'px-2 pt-0.5' : undefined}>
          <p className="m-0 text-sm leading-[19px] wrap-break-word whitespace-pre-wrap text-body">
            {linkify(msg.content).map((segment, i) =>
              segment.kind === 'link' ? (
                <a
                  key={i}
                  href={segment.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="break-all text-[#53bdeb] hover:underline"
                >
                  {segment.text}
                </a>
              ) : (
                segment.text
              )
            )}
            {showStamp && (
              <span
                aria-hidden
                className={`pointer-events-none ml-2 select-none align-bottom ${META_ROW_CLASS} opacity-0`}
              >
                {stamp}
              </span>
            )}
          </p>
          {previews}
          {showStamp && (
            <time
              dateTime={new Date(msg.sentAt).toISOString()}
              className={`pointer-events-none absolute bottom-0 right-0 translate-y-1 select-none ${META_ROW_CLASS} ${isMe ? 'text-body-700' : 'text-body-300'}`}
            >
              {stamp}
            </time>
          )}
          </div>
          )}
        </div>
        {/* Sits below the absolutely-positioned stamp, so the two never collide. */}
        {failed && (
          <button
            type="button"
            className="acr-retry"
            onClick={() => onRetry(msg.id)}
            title={msg.failureReason ?? 'Tap to resend'}
          >
            {msg.failureReason ?? 'Not sent — tap to resend'}
          </button>
        )}
      </div>
      {/* Reactions sit under the bubble, overlapping its bottom edge. */}
      <MessageReactionBar
        reactions={msg.reactions}
        enabled={canReact}
        align={isMe ? 'end' : 'start'}
        onReact={(reaction) => onReact(msg.id, reaction)}
      />
      </div>

      {viewing && msg.image && (
        <ImageViewer
          mediaFiles={photos.length > 0 ? photos : [{ _id: msg.id, url: msg.image.url, name: 'photo', fileType: 'image' }]}
          initialIndex={Math.max(0, photos.findIndex((p) => p._id === msg.id))}
          onClose={() => setViewing(false)}
        />
      )}

    </div>
  );
}
