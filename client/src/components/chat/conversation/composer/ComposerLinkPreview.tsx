import LinkPreviewCard from '@/components/chat/link/LinkPreviewCard';
import { LINK_PREVIEW_WIDTH_CLASS } from '@/constants/chat';
import type { ParsedLink } from '@/utils/linkParser';

type ComposerLinkPreviewProps = {
  link: ParsedLink;
  onDismiss: () => void;
};

const ComposerLinkPreview = ({ link, onDismiss }: ComposerLinkPreviewProps) => (
  <div className={`absolute bottom-14 left-0 z-50 mb-2 ${LINK_PREVIEW_WIDTH_CLASS} md:right-auto`}>
    <LinkPreviewCard link={link} surface="composer" onDismiss={onDismiss} />
  </div>
);

export default ComposerLinkPreview;
