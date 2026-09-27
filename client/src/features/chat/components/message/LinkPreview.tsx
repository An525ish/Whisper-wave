import LinkPreviewCard from '@/features/chat/components/link/LinkPreviewCard';
import type { ParsedLink } from '@/features/chat/utils/linkParser';

type LinkPreviewProps = {
  link: ParsedLink;
  variant?: 'incoming' | 'outgoing';
  /** First preview in a link-only bubble — no top margin. */
  lead?: boolean;
};

const LinkPreview = ({
  link,
  variant = 'incoming',
  lead = false,
}: LinkPreviewProps) => (
  <LinkPreviewCard link={link} surface={variant} href={link.url} lead={lead} />
);

export default LinkPreview;
