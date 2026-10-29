import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import { MEDIA_TIME_CLASS, RenderAttachments } from '@/features/chat';
import Image from '@/shared/components/ui/Image';
import ImageViewer from '@/shared/components/ui/image-viewer/ImageViewer';
import SwipeToReply from '@/shared/components/ui/SwipeToReply';
import ReplyQuote from '@/shared/components/ui/reply/ReplyQuote';
import ThreeDotsIcon from '@/shared/components/ui/icons/ThreeDots';
import type { useLongPress } from '@/shared/hooks/useLongPress';
import { initialOf } from '../utils/art';
import { timeLabel } from '../utils/thread';
import type { RoomMessage, RoomReactionKey } from '../types';
import RoomReactions from './RoomReactions';
import './roomMessage.css';

type Props = {
  message: RoomMessage;
  /** Quoted message for `replyTo`, resolved from the thread. */
  replyQuote: { alias: string; preview: string } | null;
  /** This message is the viewer's own — right-aligned bubble. */
  mine: boolean;
  /** Same author as the message above — no avatar/name. */
  joinedAbove: boolean;
  /** Reaction keys the viewer holds on this message. */
  myKeys: RoomReactionKey[];
  onReact: (messageId: string, reaction: RoomReactionKey) => void;
  onReply: (messageId: string) => void;
  /** Right-click a bubble — opens the message menu at the cursor. */
  onContextMenu: (e: ReactMouseEvent, message: RoomMessage) => void;
  /** The "Message actions" button — same menu, anchored to the button. */
  onOpenMenu: (message: RoomMessage, button: HTMLElement) => void;
  /** Touch long-press binder — same menu at the fingertip. */
  bindLongPress: ReturnType<typeof useLongPress<RoomMessage>>;
};

/**
 * One room message in the main-chat row anatomy: avatar beside the bubble
 * (others, run starts only), name inside the bubble top in the persona color,
 * timestamp on the tail, reactions below. The same Reply / Copy / Report (and
 * mod) menu opens by right-click, long-press, or the focusable actions button;
 * swipe replies on touch screens.
 */
const RoomMessageRow = ({
  message,
  replyQuote,
  mine,
  joinedAbove,
  myKeys,
  onReact,
  onReply,
  onContextMenu,
  onOpenMenu,
  bindLongPress,
}: Props) => {
  const [viewing, setViewing] = useState(false);
  if (message.system) {
    return (
      <div className="rm-sys">
        <p>〜 {message.text}</p>
      </div>
    );
  }

  const showHead = !mine && !joinedAbove;
  const mediaOnly = Boolean(message.media) && !message.text.trim();
  const mediaClass = message.media ? (mediaOnly ? 'rm-bubble--media' : 'rm-bubble--media rm-bubble--mediatext') : '';
  const actions = (
    <button
      type="button"
      aria-label="Message actions"
      aria-haspopup="menu"
      onClick={(e) => onOpenMenu(message, e.currentTarget)}
      className="rm-actionsbtn"
    >
      <ThreeDotsIcon aria-hidden className="h-4 w-4 fill-current" />
    </button>
  );

  return (
    <div className={`rm-bubblerow group${mine ? ' rm-bubblerow--mine' : ''}`}>
      <div className="rm-bubblewrap">
        <div className="rm-bubbleavatarrow">
          {!mine && !joinedAbove && (
            <span
              aria-hidden
              className={`rm-avatar${message.from.avatar ? ' rm-avatar--photo' : ''}`}
              style={
                message.from.avatar
                  ? undefined
                  : {
                      color: '#fff',
                      backgroundImage: `linear-gradient(145deg, ${message.from.color}, color-mix(in srgb, ${message.from.color} 50%, #000))`,
                    }
              }
            >
              {message.from.avatar ? (
                <Image src={message.from.avatar} alt="" className="h-full w-full rounded-full object-cover" displayWidth={64} showLoading={false} />
              ) : (
                initialOf(message.from.alias)
              )}
            </span>
          )}
          {mine && actions}
          <SwipeToReply
            side={mine ? 'end' : 'start'}
            shellClassName={mine ? 'bubble-out' : 'bubble-in'}
            onReply={() => onReply(message.id)}
          >
            <div
              className={`rm-bubble ${mediaClass ? `${mediaClass} ` : ''}${mine ? 'bubble-out border border-green/35 bg-green-dark/55 rm-new-r' : 'bubble-in border border-border bg-primary/90 rm-new-l'}${message.hidden ? ' rm-bubble--hidden' : ''}`}
              onContextMenu={(e) => onContextMenu(e, message)}
              {...bindLongPress(message)}
            >
              {showHead && (
                <p className="rm-bubblename" style={{ color: message.from.color }}>
                  {message.from.alias}
                  {message.from.role !== 'member' && (
                    <span className="rm-rolebadge">{message.from.role.toUpperCase()}</span>
                  )}
                </p>
              )}
              {replyQuote && (
                <div className="mb-1.5">
                  <ReplyQuote
                    tone={mine ? 'outgoing' : 'incoming'}
                    senderName={replyQuote.alias}
                    previewText={replyQuote.preview}
                  />
                </div>
              )}
              {message.hidden && <p className="rm-hiddennote">Hidden — only mods see this</p>}
              {message.media && (
                <button type="button" className={`rm-media${mediaOnly ? '' : ' mb-1.5'}`} aria-label="Open photo" onClick={() => setViewing(true)}>
                  <RenderAttachments
                    fileType={message.media.kind === 'gif' ? 'gif' : 'image'}
                    url={message.media.url}
                    name={message.media.kind}
                    overlay={
                      mediaOnly ? (
                        <time
                          dateTime={new Date(message.ts).toISOString()}
                          className={`pointer-events-none absolute bottom-0 right-0.5 z-2 ${MEDIA_TIME_CLASS}`}
                        >
                          {timeLabel(message.ts)}
                        </time>
                      ) : null
                    }
                  />
                </button>
              )}
              {viewing && message.media && (
                <ImageViewer
                  mediaFiles={[{ _id: message.id, url: message.media.url, name: 'photo', fileType: 'image' }]}
                  initialIndex={0}
                  onClose={() => setViewing(false)}
                />
              )}
              {!mediaOnly && (
                <div className={message.media ? 'px-2 pt-0.5' : undefined}>
                  <p className="rm-bubbletext">
                    {message.text}
                    <span aria-hidden className="rm-bubbletime rm-bubbletime--ghost">
                      {timeLabel(message.ts)}
                    </span>
                  </p>
                  <time className="rm-bubbletime" dateTime={new Date(message.ts).toISOString()}>
                    {timeLabel(message.ts)}
                  </time>
                </div>
              )}
            </div>
          </SwipeToReply>
          {!mine && actions}
        </div>

        <RoomReactions message={message} mine={mine} hasAvatar={!mine && !joinedAbove} myKeys={myKeys} onReact={onReact} />
      </div>
    </div>
  );
};

export default RoomMessageRow;
