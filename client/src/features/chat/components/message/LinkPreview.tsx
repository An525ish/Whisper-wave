import LinkPreviewCard from '../link/LinkPreviewCard';
import type { ParsedLink } from '../../utils/linkParser';

type Props = {
  link: ParsedLink;
  variant?: 'incoming' | 'outgoing';
  /** First preview in a link-only bubble — no top margin. */
  lead?: boolean;
};

const LinkPreview = ({
  link,
  variant = 'incoming',
  lead = false,
}: Props) => (
  <LinkPreviewCard link={link} surface={variant} href={link.url} lead={lead} />
);

export default LinkPreview;
