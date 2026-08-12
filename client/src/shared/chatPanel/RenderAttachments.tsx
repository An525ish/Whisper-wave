import { fileData, fileFormat, transformImage, type FileFormatKind } from "@/lib/features";
import Image from "@/components/ui/Image";
import CircularLoader from '@/components/ui/loaders/CircualrLoader';

type RenderAttachmentsProps = {
    fileType: FileFormatKind | string;
    url: string;
    name?: string;
    type?: string;
    size?: number;
    isUploading?: boolean;
};

type RenderFileProps = {
    fileExtension: string;
    fileName?: string;
};

const mediaFrameClass =
  'h-auto w-full max-w-[min(100%,12.5rem)] aspect-[4/3] object-cover rounded-md';

const RenderAttachments = ({ fileType, url, name, type, isUploading }: RenderAttachmentsProps) => {
    const isObjectUrl = url.startsWith('blob:') || url.startsWith('data:');

    const isImage = type?.startsWith('image/');
    const isVideo = type?.startsWith('video/');
    const isAudio = type?.startsWith('audio/');
    const fileExtension = fileFormat(name)

    const renderFilePreview = () => {
        if (isObjectUrl) {
            return (
                <>
                    {isImage && (
                        <div className="relative w-full max-w-[min(100%,12.5rem)]">
                            <Image
                                src={url}
                                alt={name}
                                className={`${mediaFrameClass} transition-opacity duration-300`}
                            />
                            {(isUploading) && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                                    <CircularLoader />
                                </div>
                            )}
                        </div>
                    )}
                    {isVideo && (
                        <div className="relative w-full max-w-[min(100%,12.5rem)]">
                            <video
                                src={url}
                                className={mediaFrameClass}
                                controls
                            />
                            {(isUploading) && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                                    <CircularLoader />
                                </div>
                            )}
                        </div>
                    )}
                    {isAudio && (
                        <div className="relative w-full max-w-[min(100%,15.625rem)]">
                            <audio
                                src={url}
                                controls
                                className="w-full max-w-full"
                            />
                            {(isUploading) && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                                    <CircularLoader />
                                </div>
                            )}
                        </div>
                    )}
                    {!isImage && !isVideo && !isAudio && (
                        <div className="relative">
                            <RenderFile fileExtension={fileExtension} fileName={name} />
                            {(isUploading) && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                                    <CircularLoader />
                                </div>
                            )}
                        </div>
                    )}
                </>
            );
        } else {
            switch (fileType) {
                case 'video':
                    return (
                        <video
                            src={url}
                            preload="none"
                            className={`${mediaFrameClass} max-w-[min(100%,15.625rem)]`}
                            controls
                        />
                    );
                case 'image':
                    return (
                        <div className="relative w-full max-w-[min(100%,12.5rem)]">
                            <img
                                src={transformImage(url, 200)}
                                alt={name || "attachment"}
                                className={`${mediaFrameClass} transition-opacity duration-300`}
                            />
                        </div>
                    );
                case 'audio':
                    return (
                        <audio
                            src={url}
                            preload="none"
                            className="w-full max-w-[min(100%,15.625rem)] bg-transparent"
                            controls
                        />
                    );
                default:
                    return <RenderFile fileExtension={fileExtension} fileName={name} />;
            }
        }
    };

    return (
        <div className="attachment-container max-w-full">
            {renderFilePreview()}
        </div>
    );
};


const RenderFile = ({ fileExtension, fileName }: RenderFileProps) => {
    const fileDetails = fileData.find((file => file.docType === fileExtension))

    return (
        <div className="relative grid aspect-[4/3] w-full max-w-[min(100%,12.5rem)] place-items-center rounded bg-background-alt/30">
            <div className="px-2">
                <img src={fileDetails?.icon} alt={fileName} className="mx-auto h-20 w-auto max-w-full object-contain sm:h-[100px]" />
                <p className='my-1 w-full max-w-32 truncate text-center text-sm capitalize'>{fileName}</p>
            </div>
        </div>
    )
}


export default RenderAttachments;
