import { fileData, fileFormat } from "@/lib/features";
import Image from "../ui/Image";

const FilePreview = ({ file, onRemove }) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const fileExension = fileFormat(file.name)


    return (
        <div className="relative grid place-items-center m-2">
            {isImage && (
                <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-20 h-20 object-cover rounded"
                />
            )}
            {isVideo && (
                <video
                    src={URL.createObjectURL(file)}
                    className="w-20 h-20 object-cover rounded"
                />
            )}
            {isAudio && (
                <audio
                    src={URL.createObjectURL(file)}
                    controls
                    className="w-20 h-20"
                />
            )}
            {!isImage && !isVideo && !isAudio && (
                <RenderFile fileExension={fileExension} fileName={file.name} />
            )}
            <button
                onClick={() => onRemove(file)}
                className="absolute top-0 right-0 bg-primary text-white rounded-full w-[18px] h-[18px] flex items-center justify-center"
            >
                ×
            </button>
        </div>
    );
};

const RenderFile = ({ fileExension, fileName }) => {
    const fileDetails = fileData.find((file => file.docType === fileExension))

    return (
        <div className="relative w-20 h-20 bg-gray-200 flex items-center justify-center rounded">
            <img src={fileDetails.icon} alt={'file.docName'} className="w-full h-full" />
            <span className='absolute -bottom-2 text-center w-20 truncate capitalize text-sm'>{fileName}</span>
        </div>
    )
}

export default FilePreview;