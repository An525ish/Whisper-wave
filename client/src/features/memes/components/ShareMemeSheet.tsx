import { useState } from 'react';
import { ForwardDialog } from '@/features/chat';
import { useMemeShare } from '../hooks/useMemeShare';
import MemeSignInDialog from './MemeSignInDialog';
import type { MemeItem } from '../types';

type Props = {
  item: MemeItem;
  open: boolean;
  onClose: () => void;
};

/**
 * Share a joke with the same picker as forwarding in chats: members tick one or
 * more chats (or copy the text); guests are asked to sign in, because chats live
 * behind an account.
 */
const ShareMemeSheet = ({ item, open, onClose }: Props) => {
  const { isMember, shareToChats, copyText } = useMemeShare(onClose);
  const [sending, setSending] = useState(false);

  if (!isMember) {
    return (
      <MemeSignInDialog
        open={open}
        onClose={onClose}
        title="Sign in to share"
        body="Keep the ones worth sending. Drop them straight into your chats."
      />
    );
  }

  // Mounted only while open: every meme card renders this sheet.
  if (!open) return null;

  return (
    <ForwardDialog
      open
      title="Share"
      actionLabel="Send"
      secondary={{ label: 'Copy text instead', onClick: () => copyText(item) }}
      isForwarding={sending}
      onClose={onClose}
      onForward={async (chatIds) => {
        setSending(true);
        try {
          await shareToChats(item, chatIds);
        } finally {
          setSending(false);
        }
      }}
    />
  );
};

export default ShareMemeSheet;
