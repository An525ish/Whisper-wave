import { useState, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import ImageViewerIcon from './Image-Viewer-Icons';
import { fileFormat, transformImage } from '@/lib/features';
import toast from 'react-hot-toast';
import { getRequest } from '@/utils/api';
import axios from 'axios';

const ImageViewer = ({ media = [], initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);

    const mediaFiles = media.filter((file) => file.fileType !== 'document')


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : mediaFiles.length - 1));
        setScale(1);
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex < mediaFiles.length - 1 ? prevIndex + 1 : 0));
        setScale(1);
    };

    const handleDownload = async () => {
        try {
            const file = await fetch(currentMedia.url)
            const blob = await file.blob()
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = currentMedia.name || 'download';
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Download Failed')
        }
    };

    const [{ x, y }, set] = useSpring(() => ({ x: 0, y: 0 }));

    const bind = useDrag(({ down, movement: [mx, my], pinching, delta: [, dy] }) => {
        if (pinching) {
            setScale(Math.max(1, Math.min(scale + dy * 0.01, 3)));
        } else {
            set({ x: down ? mx : 0, y: down ? my : 0, immediate: down });
        }
    }, {
        rubberband: true,
        bounds: { left: -100, right: 100, top: -100, bottom: 100 },
        preventDefault: true,
    });

    const handleDoubleClick = () => {
        setScale(scale === 1 ? 2 : 1);
    };

    const currentMedia = mediaFiles?.[currentIndex];
    const fileExtension = fileFormat(currentMedia?.url)
    const isVideo = fileExtension === 'video';

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
            {/* Header */}
            <div className="text-white py-4 px-8 flex items-center justify-between">
                <div className='flex gap-4 items-center'>
                    <button onClick={onClose} className="text-3xl font-bold">
                        ←
                    </button>

                    {mediaFiles.length !== 0 && <p className='w-80 truncate'>{currentMedia.name || 'Unkown file'}</p>}
                </div>

                {mediaFiles.length !== 0 && <div className="flex items-center space-x-4">
                    <span>{currentIndex + 1} / {mediaFiles.length}</span>
                    <ImageViewerIcon
                        name="download"
                        className="fill-white cursor-pointer"
                        onClick={handleDownload}
                    />
                </div>}
            </div>

            {/* Main Media Area */}
            {
                media?.length === 0 ?
                    <div className='grid place-items-center w-full h-full'>
                        <div className='w-full'>
                            <img src="/images/no-media.svg"
                                alt="no-media"
                                className='w-80 mx-auto opacity-50'
                            />
                            <p className='text-center text-xl text-body-300 mt-8'>No Media Found</p>
                        </div>
                    </div>
                    :
                    <>
                        <div className="flex-grow flex items-center justify-center relative overflow-hidden">
                            <button onClick={handlePrev} className="absolute left-4 text-white text-4xl z-10">&lt;</button>
                            <animated.div
                                {...bind()}
                                style={{ x, y, touchAction: 'none' }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                {isVideo ? (
                                    <video
                                        src={currentMedia.url}
                                        className="max-h-full max-w-full object-contain"
                                        controls
                                    ></video>
                                ) : (
                                    <animated.img
                                        src={currentMedia.url}
                                        alt={currentMedia.name}
                                        className="max-h-full max-w-full transition-all object-contain select-none"
                                        style={{ transform: `scale(${scale})` }}
                                        onDoubleClick={handleDoubleClick}
                                    />
                                )}
                            </animated.div>
                            <button onClick={handleNext} className="absolute right-4 text-white text-4xl z-10">&gt;</button>
                        </div>

                        {/* Thumbnail Strip */}
                        <div className="bg-background-alt p-2 flex justify-center">
                            <div className="flex min-w-full gap-2 overflow-x-auto scrollbar-hide">
                                {mediaFiles.map((item, index) => {
                                    const transformedUrl = transformImage(item.url)
                                    const fileExtension = fileFormat(item.url)

                                    return (
                                        <div
                                            key={item._id}
                                            className={`h-16 flex-shrink-0 basis-28 rounded-sm overflow-hidden mx-auto cursor-pointer ${index === currentIndex ? 'border-2 border-green' : ''}`}
                                            onClick={() => {
                                                setCurrentIndex(index);
                                                setScale(1);
                                            }}
                                        >
                                            {fileExtension === 'video' ? (
                                                <video
                                                    src={transformedUrl}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={transformedUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
            }

        </div>
    );
};

export default ImageViewer;