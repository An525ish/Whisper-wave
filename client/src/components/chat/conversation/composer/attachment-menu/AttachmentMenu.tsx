import {
  useEffect,
  useRef,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import toast from 'react-hot-toast';
import { validateFiles } from '@/utils/helpers';
import { UPLOAD_TYPES, type UploadLimits } from '@/constants/upload';

type AttachmentMenuProps = {
  onClose: () => void;
  onFileSelect: (type: string, files: File[]) => void;
  clipIconRef: RefObject<HTMLElement | null>;
};

const AttachmentMenu = ({
  onClose,
  onFileSelect,
  clipIconRef,
}: AttachmentMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleUpload = useCallback(
    (files: FileList | null, limits: UploadLimits, type: string) => {
      if (!files) return;
      const error = validateFiles(files, limits.individual, limits.cumulative);
      if (error) { toast.error(error); return; }
      onFileSelect(type, Array.from(files));
      onClose();
      console.log(`${type} uploaded:`, files);
    },
    [onClose, onFileSelect],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        clipIconRef.current &&
        !clipIconRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, clipIconRef]);

  return (
    <div
      ref={menuRef}
      className="absolute z-20 bg-primary border border-border rounded shadow-lg bottom-12 right-4"
    >
      <ul className="w-max">
        {Object.values(UPLOAD_TYPES).map(({ title, Icon, accept, limits }) => (
          <li
            key={title}
            className="px-4 py-2 text-body-700 border-0 border-b full-border cursor-pointer hover:bg-gradient-dark-black transition group"
            onClick={(e: ReactMouseEvent) => {
              e.stopPropagation();
              document.getElementById(`${title}-input`)?.click();
            }}
          >
            <Icon className="w-5 h-5 fill-body-300 group-hover:fill-body-700 inline-block mr-2" />
            <label className="cursor-pointer group-hover:text-body">{title}</label>
            <input
              type="file"
              id={`${title}-input`}
              name="files"
              accept={accept}
              multiple={true}
              className="hidden"
              onChange={(e) => handleUpload(e.target.files, limits, title)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttachmentMenu;
