import DocCardInner from './DocCardInner';
import { ATTACHMENT_LIST_CARD_CLASS } from '../../../constants/attachments';
import type { FlatItem } from '../../../types';
import { fileData, fileFormat, type FileDocType } from '@/shared/utils/fileFormat';

type Props = {
  item: FlatItem;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (msgId: string) => void;
};

const DocCard = ({ item, isSelectMode, isSelected, onToggleSelect }: Props) => {
  const { att, msg } = item;
  const fileExtension = fileFormat(att.name);
  const fileDetails = fileData.find((entry) => entry.docType === (fileExtension as FileDocType));
  const extLabel =
    fileExtension && fileExtension !== 'unknown'
      ? fileExtension.toUpperCase()
      : (att.name.split('.').pop() ?? 'FILE').toUpperCase().slice(0, 4);

  if (isSelectMode) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect?.(msg._id)}
        className={`${ATTACHMENT_LIST_CARD_CLASS} text-left ${isSelected ? 'ring-1 ring-green/50 bg-green/5' : ''}`}
      >
        <DocCardInner att={att} msg={msg} fileDetails={fileDetails} extLabel={extLabel} isSelectMode isSelected={isSelected} />
      </button>
    );
  }

  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer" className={ATTACHMENT_LIST_CARD_CLASS}>
      <DocCardInner att={att} msg={msg} fileDetails={fileDetails} extLabel={extLabel} />
    </a>
  );
};

export default DocCard;
