import { splitTextByUrls } from '@/shared/utils/linkParser';
import type { ReactNode } from 'react';

type MessageContentProps = {
  content: string;
  highlightQuery?: string;
};

const renderHighlightedText = (text: string, query?: string): ReactNode => {
  if (!query?.trim()) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'));

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-sm bg-[#f6e05e]/85 px-0.5 text-background"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
};

const MessageContent = ({ content, highlightQuery }: MessageContentProps) => {
  const parts = splitTextByUrls(content);

  return (
    <>
      {parts.map((part, index) =>
        part.type === 'url' ? (
          <a
            key={`${part.value}-${index}`}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[#53bdeb] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {renderHighlightedText(part.value, highlightQuery)}
          </a>
        ) : (
          <span key={`text-${index}`}>
            {renderHighlightedText(part.value, highlightQuery)}
          </span>
        ),
      )}
    </>
  );
};

export default MessageContent;
