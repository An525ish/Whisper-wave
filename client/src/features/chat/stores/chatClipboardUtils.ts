import type { ChatBoxData } from '@/features/chat/types';
import type { ChatCopyPayload } from '@/features/chat/types';

type CopyAttachment = NonNullable<ChatBoxData['attachments']>[number] & {
  fileType?: string;
  uploading?: boolean;
};

const guessMime = (att: CopyAttachment, blobType: string): string => {
  if (att.type?.includes('/')) return att.type;
  if (att.fileType?.includes('/')) return att.fileType;
  if (blobType && blobType !== 'application/octet-stream') return blobType;

  const name = att.name ?? '';
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg';
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.gif$/i.test(name)) return 'image/gif';
  if (/\.webp$/i.test(name)) return 'image/webp';
  if (/\.mp4$/i.test(name)) return 'video/mp4';
  if (/\.webm$/i.test(name)) return 'video/webm';
  if (/\.mp3$/i.test(name)) return 'audio/mpeg';
  if (/\.wav$/i.test(name)) return 'audio/wav';
  if (/\.pdf$/i.test(name)) return 'application/pdf';
  return 'application/octet-stream';
};

export const attachmentToFile = async (
  att: CopyAttachment,
): Promise<File | null> => {
  const url = att.url || att.tempUrl;
  if (!url || att.uploading) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const name = att.name?.trim() || 'attachment';
    const type = guessMime(att, blob.type);
    return new File([blob], name, { type });
  } catch {
    return null;
  }
};

export const getMessageCopyText = (msg: {
  content?: string;
  attachments?: CopyAttachment[];
}): string => {
  const text = msg.content?.trim();
  if (text) return text;
  const names = (msg.attachments ?? [])
    .map((att) => att.name)
    .filter(Boolean) as string[];
  if (names.length > 0) return names.join(', ');
  return '';
};

export const buildChatCopyPayload = async (
  messages: Array<{
    content?: string;
    attachments?: CopyAttachment[];
  }>,
): Promise<ChatCopyPayload> => {
  const text = messages
    .map(getMessageCopyText)
    .filter(Boolean)
    .join('\n');

  const files: File[] = [];
  for (const msg of messages) {
    for (const att of msg.attachments ?? []) {
      const file = await attachmentToFile(att);
      if (file) files.push(file);
    }
  }

  return { text, files };
};

export const writeCopyPayloadToSystemClipboard = async (
  payload: ChatCopyPayload,
): Promise<void> => {
  const { text, files } = payload;

  if (files.length === 1 && files[0].type.startsWith('image/')) {
    const file = files[0];
    await navigator.clipboard.write([
      new ClipboardItem({
        [file.type]: file,
        ...(text ? { 'text/plain': new Blob([text], { type: 'text/plain' }) } : {}),
      }),
    ]);
    return;
  }

  if (text) {
    await navigator.clipboard.writeText(text);
  }
};

export const readFilesFromClipboardEvent = (
  dataTransfer: DataTransfer,
): File[] => {
  const fromFiles = Array.from(dataTransfer.files);
  if (fromFiles.length > 0) return fromFiles;

  const fromItems: File[] = [];
  for (const item of Array.from(dataTransfer.items)) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file) fromItems.push(file);
  }
  return fromItems;
};
