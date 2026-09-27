import type { splitTextByUrls } from '@/features/chat/utils/linkParser';

type TextHighlightMirrorProps = {
  parts: ReturnType<typeof splitTextByUrls>;
  className: string;
};

/**
 * Mirror layer stacked in the same grid cell as the composer textarea. Renders the
 * same text with URLs tinted so links appear highlighted while the real textarea
 * sits on top with transparent text. Typography only; no min-height.
 */
const TextHighlightMirror = ({ parts, className }: TextHighlightMirrorProps) => (
  <div
    aria-hidden
    className={`pointer-events-none col-start-1 row-start-1 overflow-hidden whitespace-pre-wrap wrap-break-word ${className}`}
  >
    {parts.map((part, i) =>
      part.type === 'url' ? (
        <span key={i} className="text-[#53bdeb]">{part.value}</span>
      ) : (
        <span key={i} className="text-transparent">{part.value}</span>
      ),
    )}
  </div>
);

export default TextHighlightMirror;
