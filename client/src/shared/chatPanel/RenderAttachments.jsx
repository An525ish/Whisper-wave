import DefaultfileIcon from "@/components/icons/Defaultfile";
import { transformImage } from "@/lib/features";

const RenderAttachments = ({ file, url }) => {
    switch (file) {
        case 'video':
            return <video src={url} preload="none" className="w-[250px] h-[150px] rounded-md" controls></video>
        case 'image':
            return <img src={transformImage(url, 200)} alt="attachments" className="w-[200px] h-[150px] object-cover rounded-md" ></img>
        case 'audio':
            return <audio src={url} preload="none" className="w-[250px] bg-transparent" controls></audio>

        default:
            return <DefaultfileIcon className={'w-10 '} />
    }
}

export default RenderAttachments