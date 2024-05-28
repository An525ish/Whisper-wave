import DefaultfileIcon from "@/components/icons/Defaultfile";
import { fileData, transformImage } from "@/lib/features";

const RenderAttachments = ({ file, url }) => {
    switch (file) {
        case 'video':
            return <video src={url} preload="none" className="w-[250px] h-[150px] rounded-md" controls></video>
        case 'image':
            return <img src={transformImage(url, 200)} alt="attachments" className="w-[200px] h-[150px] object-cover rounded-md" ></img>
        case 'audio':
            return <audio src={url} preload="none" className="w-[250px] bg-transparent" controls></audio>
        case 'doc':
        case 'pdf':
        case 'text':
            // Handle document, pdf, and text file previews here, if needed
            return <RenderFile fileExension={file} />;
        default:
            return <RenderFile fileExension={file} />
    }
}

export default RenderAttachments

const RenderFile = ({ file, fileExension }) => {
    const fileDetails = fileData.find((file => file.docType === fileExension))
    console.log(fileData)
    return (
        <div className="w-full h-8 rounded-lg">
            <p className="flex gap-4 items-center h-full w-[90%] cursor-pointer"><img src={fileDetails.icon} alt={'file.docName'} className="w-6" /><span className='capitalize text-sm'>{'FileName'}</span></p>
        </div>
    )
}