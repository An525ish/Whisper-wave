import { useEffect, useRef, useCallback } from "react";
import { validateFiles } from "@/utils/helper";
import ImagesIcon from "../icons/Images";
import VideosIcon from "../icons/Video";
import AudiosIcon from "../icons/Audio";
import FilesIcon from "../icons/FilesIcon";


const UPLOAD_TYPES = {
    IMAGES: {
        title: 'Images',
        accept: 'image/jpeg, image/png, image/gif',
        Icon: ImagesIcon,
        limits: { individual: 5 * 1024 * 1024, cumulative: 20 * 1024 * 1024 }
    },
    VIDEOS: {
        title: 'Videos',
        accept: 'video/mp4, video/quicktime',
        Icon: VideosIcon,
        limits: { individual: 50 * 1024 * 1024, cumulative: 50 * 1024 * 1024 }
    },
    AUDIOS: {
        title: 'Audios',
        accept: 'audio/mpeg, audio/wav, audio/ogg',
        Icon: AudiosIcon,
        limits: { individual: 5 * 1024 * 1024, cumulative: 20 * 1024 * 1024 }
    },
    DOCUMENTS: {
        title: 'Documents',
        accept: '*',
        Icon: FilesIcon,
        limits: { individual: 50 * 1024 * 1024, cumulative: 150 * 1024 * 1024 }
    },
};

const AttachmentMenu = ({ onClose, onFileSelect, clipIconRef }) => {
    const menuRef = useRef();

    const handleUpload = useCallback((files, limits, type) => {
        if (validateFiles(files, limits.individual, limits.cumulative)) {
            onFileSelect(type, Array.from(files));
            onClose();
            console.log(`${type} uploaded:`, files);
        }
    }, [onClose, onFileSelect]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && clipIconRef.current && !clipIconRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} className="absolute z-20 bg-primary border border-border rounded shadow-lg bottom-12 right-4">
            <ul className="w-max">
                {Object.values(UPLOAD_TYPES).map(({ title, Icon, accept, limits }) => (
                    <li
                        key={title}
                        className="px-4 py-2 hover:bg-gray-200 text-body-700 border-0 border-b full-border cursor-pointer hover:bg-gradient-dark-black transition group"
                        onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById(`${title}-input`).click();
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
}

export default AttachmentMenu;