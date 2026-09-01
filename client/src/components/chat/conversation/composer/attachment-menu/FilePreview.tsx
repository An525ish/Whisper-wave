import { useEffect, useState } from 'react';
import CloseIcon from '@/components/ui/icons/Close';
import { fileData, fileFormat, type FileDocType } from '@/utils/fileFormat';

type FilePreviewProps = {
  file: File;
  onRemove: (file: File) => void;
};

const thumbClass = 'h-24 w-24 rounded object-cover';
const thumbBox = 'h-24 w-24';

const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const fileExtension = fileFormat(file.name);
  const [previewSrc] = useState(() =>
    isImage || isVideo || isAudio ? URL.createObjectURL(file) : null,
  );

  useEffect(() => {
    if (!previewSrc) return;
    return () => URL.revokeObjectURL(previewSrc);
  }, [previewSrc]);

  return (
    <div className={`relative ${thumbBox} shrink-0 overflow-visible`}>
      {isImage && previewSrc ? (
        <img
          src={previewSrc}
          alt={file.name}
          draggable={false}
          className={thumbClass}
        />
      ) : null}
      {isVideo && previewSrc ? (
        <video
          src={previewSrc}
          className={thumbClass}
          muted
          playsInline
          preload="metadata"
        />
      ) : null}
      {isAudio && previewSrc ? (
        <div className={`flex ${thumbBox} items-center justify-center rounded bg-primary/80 p-1`}>
          <audio src={previewSrc} controls className="w-full" />
        </div>
      ) : null}
      {!isImage && !isVideo && !isAudio ? (
        <DocPreview fileExtension={fileExtension} fileName={file.name} />
      ) : null}
      <button
        type="button"
        onClick={() => onRemove(file)}
        aria-label={`Remove ${file.name}`}
        className="absolute right-1 top-1 z-20 grid h-5 w-5 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/30"
      >
        <CloseIcon className="h-3 w-3" />
      </button>
    </div>
  );
};

type DocPreviewProps = {
  fileExtension: string;
  fileName: string;
};

const DocPreview = ({ fileExtension, fileName }: DocPreviewProps) => {
  const fileDetails = fileData.find(
    (entry) => entry.docType === (fileExtension as FileDocType),
  );

  return (
    <div className={`flex ${thumbBox} flex-col items-center justify-center rounded bg-primary/80 p-1.5`}>
      <img
        src={fileDetails?.icon ?? fileData[0].icon}
        alt=""
        className="h-9 w-9 object-contain"
      />
      <span className="mt-0.5 w-full truncate text-center text-[10px] leading-none text-body-300">
        {fileName}
      </span>
    </div>
  );
};

export default FilePreview;
