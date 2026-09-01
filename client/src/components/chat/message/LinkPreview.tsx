import LinkPreviewCard from '@/components/chat/link/LinkPreviewCard';
import type { ParsedLink } from '@/utils/linkParser';

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
