import { fileData, fileFormat, transformImage } from "@/lib/features";
import Image from "@/components/ui/Image";
import CircularLoader from '@/components/ui/loaders/CircualrLoader';

const RenderAttachments = ({ fileType, url, name, type, isUploading }) => {
    const isObjectUrl = url.startsWith('blob:') || url.startsWith('data:');

    const isImage = type?.startsWith('image/');
    const isVideo = type?.startsWith('video/');
    const isAudio = type?.startsWith('audio/');
    const fileExtension = fileFormat(name)

    // console.log(name)
    const renderFilePreview = () => {
        if (isObjectUrl) {
            return (
                <>
                    {isImage && (
                        <div className="relative">
                            <Image
                                src={url}
                                alt={name}
                                className={`w-[200px] h-[150px] object-cover rounded transition-opacity duration-300`}
                            />
                            {(isUploading) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                    <CircularLoader />
                                </div>
                            )}
                        </div>
                    )}
                    {isVideo && (
                        <div className="relative">
                            <video
                                src={url}
                                className="[200px] h-[150px] object-cover rounded"
                                controls
                            />
                            {(isUploading) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                    <CircularLoader />
                                </div>
                            )}
                        </div>
                    )}
                    {isAudio && (
                        <div className="relative">
                            <audio
                                src={url}
                                controls
                                className="w-[250px]"
                            />
                            {(isUploading) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                    <CircularLoader />
                                </div>
                            )}
                        </div>
                    )}
                    {!isImage && !isVideo && !isAudio && (
                        <div className="relative">
                            <RenderFile fileExtension={fileExtension} fileName={name} />
                            {(isUploading) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
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
                    return <video src={url} preload="none" className="w-[250px] h-[150px] rounded-md" controls></video>;
                case 'image':
                    return (
                        <div className="relative">
                            <img
                                src={transformImage(url, 200)}
                                alt={name || "attachment"}
                                className={`w-[200px] h-[150px] object-cover rounded-md transition-opacity duration-300`}
                            />
                        </div>
                    );
                case 'audio':
                    return <audio src={url} preload="none" className="w-[250px] bg-transparent" controls></audio>;
                default:
                    return <RenderFile fileExtension={fileExtension} fileName={name} />;
            }
        }
    };

    return (
        <div className="attachment-container">
            {renderFilePreview()}
        </div>
    );
};


const RenderFile = ({ fileExtension, fileName }) => {
    const fileDetails = fileData.find((file => file.docType === fileExtension))

    return (
        <div className="relative w-[200px] h-[150px] grid place-items-center bg-background-alt/30 rounded">
            <div>
                <img src={fileDetails.icon} alt={fileName} className="w-full h-[100px] object-contain" />
                <p className='text-center my-1 w-32 truncate capitalize text-sm'>{fileName}</p>
            </div>
        </div>
    )
}


export default RenderAttachments;