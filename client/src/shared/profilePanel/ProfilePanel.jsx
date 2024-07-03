import ImageViewer from '@/components/image-viewer/Image-Viewer'
import SkeletonBox from '@/components/skeletons/SkeletonBox'
import Image from '@/components/ui/Image'
import Carousel from '@/components/ui/carousel/Carousel'
import useErrors from '@/hooks/error'
import { useSocket } from '@/hooks/socketContext'
import useSocketEvent from '@/hooks/socketEvent'
import { fileData, fileFormat, transformImage } from '@/lib/features'
import { NEW_ATTACHMENT } from '@/lib/socketConstants'
import { useChatDetailsQuery, useGetMediaQuery } from '@/redux/reducers/apis/api'
import { getFirstName } from '@/utils/helper'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

const renderMediaThumbnail = (file) => {
    const transformedUrl = transformImage(file.url)
    const fileExtension = fileFormat(file.url)

    switch (fileExtension) {
        case 'image':
            return (
                <Image
                    src={transformedUrl}
                    alt={file.name}
                    className="w-24 h-20 bg-primary rounded object-cover"
                />
            )
        case 'video':
            return (
                <video
                    src={transformedUrl}
                    className='w-24 h-20 bg-primary object-cover rounded-lg'
                />
            )
        case 'audio':
            return (
                <div className="w-24 h-20 bg-primary rounded flex items-center justify-center">
                    <img src="/icons/music-icon.svg" alt="Audio" className="w-12 h-12" />
                </div>
            )
        default:
            return null
    }
}


const ProfilePanel = () => {
    const { chatId } = useParams()
    const socket = useSocket()

    const { user } = useSelector(state => state.auth)

    const [viewerOpen, setViewerOpen] = useState(false);
    const [initialImageIndex, setInitialImageIndex] = useState(0);

    const openImageViewer = (index) => {
        setInitialImageIndex(index);
        setViewerOpen(true);
    };


    const { data: profileDetails, isLoading, error, isError } = useChatDetailsQuery({
        id: chatId,
        populate: true
    }, { skip: !chatId })

    const { data: media, isLoading: isMediaLoading, error: mediaError, isError: isMediaError, refetch } = useGetMediaQuery({ chatId }, { skip: !chatId })

    useErrors([{ error, isError }, { mediaError, isMediaError }])

    const newAttachmentListener = useCallback(() => {
        refetch()
    }, [refetch],
    )

    const events = {
        [NEW_ATTACHMENT]: newAttachmentListener
    }

    useSocketEvent(socket, events)

    if (chatId) {
        if (isLoading) return <></>
        if (!profileDetails || !profileDetails.data) return <div>No profile data available</div>
    }

    const profileData = chatId ? profileDetails.data : user
    const { name, avatar, bio, creator, members, groupChat } = profileData

    const creatorName = creator ? getFirstName(creator.name) : 'Unknown'

    const mediaData = media?.data || []
    const mediaFiles = mediaData.filter((file) => file.fileType !== 'document')
    const docFiles = mediaData.filter((file) => file.fileType === 'document')

    const handleFileAction = async (e, url, name) => {
        e.preventDefault();
        const fileType = fileFormat(url);

        if (['pdf'].includes(fileType)) {
            // Open in a new tab for supported formats
            window.open(url, '_blank');
        } else {
            // Download for unsupported formats
            try {
                const file = await fetch(url)
                const blob = await file.blob()
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = name;
                link.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                toast.error('Download Failed')
            }
        }
    };

    return (
        <>
            {viewerOpen && (
                <ImageViewer
                    mediaFiles={mediaFiles}
                    initialIndex={initialImageIndex}
                    onClose={() => setViewerOpen(false)}
                />
            )}

            <div className="relative bg-background-alt rounded-2xl mt-16 h-[78vh] py-2">
                <div className="w-24 h-24 rounded-full bg-primary absolute -top-14 left-1/2 -translate-x-1/2 overflow-hidden z-10 border-8 border-background">
                    <Image src={avatar} className={'w-full'} alt={name} />
                </div>

                <p className="text-center text-xl w-52 truncate mx-auto capitalize font-medium mt-10">{name}</p>

                <div className='overflow-y-auto scrollbar-hide h-[65vh]'>

                    {chatId && groupChat ? (
                        <div className='p-4 flex gap-4 h-[12rem]'>
                            <div className='flex-[1]'>
                                <Image src={creator.avatar} alt="" className='object-fill w-28 h-28 rounded-full bg-background-alt border-2 border-white' />
                                <p className='font-medium text-center text-lg capitalize mt-2 w-28 truncate text-body'>{creatorName}</p>
                                <p className='text-xs text-center text-body-700 border-0 border-b full-border pb-1 tracking-widest'>Creator</p>
                            </div>

                            <div className=''>
                                <Carousel
                                    members={members}
                                    className={'w-[12rem] h-full'}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 mt-4 text-center">
                            <p className="text-body-700 w-fit mx-auto px-12 capitalize border-0 border-b full-border pb-1">Bio</p>
                            <p className="mt-2 text-sm">{bio || 'No bio available'}</p>
                        </div>
                    )}

                    <div className="mt-4 pl-2 pr-1">
                        <p className="px-2 text-body-700 capitalize border-0 border-b half-border pb-1">Photos & Multimedia</p>
                        <div className="flex gap-4 flex-wrap my-4 overflow-y-auto scrollbar-custom max-h-[11rem]">
                            {
                                isMediaLoading ?
                                    <div className='flex flex-wrap justify-center gap-2'>
                                        {Array(6).fill(0).map((i) => <SkeletonBox key={i} className={'w-24 h-20 bg-primary'} />)}
                                    </div>
                                    :
                                    <>
                                        {mediaFiles.length === 0 ?
                                            <div className='grid place-items-center w-full'>
                                                <div className='w-full'>
                                                    <img src="/images/no-media.svg"
                                                        alt="no-media"
                                                        className='w-20 mx-auto opacity-50'
                                                    />
                                                    <p className='text-center text-body-300 text-sm mt-4'>No Media Found</p>
                                                </div>
                                            </div>
                                            : mediaFiles.slice(0, 8).map((file, index) => (
                                                <div
                                                    key={file._id}
                                                    onClick={() => openImageViewer(index)}
                                                    className='hover:opacity-50 transition-opacity cursor-pointer'
                                                >
                                                    {renderMediaThumbnail(file, index)}
                                                </div>
                                            ))}
                                    </>
                            }
                        </div>
                        <p
                            className="text-center py-0.5 bg-red-dark text-red border border-red-light rounded-xl w-fit px-4 text-xs mx-auto cursor-pointer"
                            onClick={() => openImageViewer(0)}
                        >
                            View All
                        </p>
                    </div>

                    <div className="px-4 mt-4">
                        <p className="px-2 text-body-700 capitalize border-0 border-b half-border pb-1">Attachments</p>
                        <div className="flex flex-col gap-2 my-4 overflow-y-scroll scrollbar-custom max-h-[7rem]">
                            {
                                isMediaLoading ?
                                    <div className='flex flex-col items-center gap-2'>
                                        {Array(3).fill(0).map((i) =>
                                            <div key={i} className='flex gap-4 items-center'>
                                                <SkeletonBox className={'w-3 h-8 bg-primary'} />
                                                <SkeletonBox className={'w-52 h-3 bg-primary'} />
                                            </div>
                                        )}
                                    </div>
                                    :
                                    <>
                                        {docFiles.length === 0 ?
                                            <div className='grid place-items-center w-full'>
                                                <div className='w-full'>
                                                    <img src="/images/no-documents.svg"
                                                        alt="no-media"
                                                        className='w-20 mx-auto opacity-50'
                                                    />
                                                    <p className='text-center text-body-300 text-sm mt-4'>No Document Found</p>
                                                </div>
                                            </div>
                                            :
                                            docFiles.map(({ _id, name, url }) => {
                                                const fileExtension = fileFormat(name)

                                                const file = fileData.find((file => file.docType === fileExtension))
                                                return (
                                                    <div
                                                        key={_id}
                                                        onClick={(e) => handleFileAction(e, url, name)}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="w-full h-8 rounded-lg">
                                                            <p className="flex gap-4 items-center h-full w-[90%] cursor-pointer">
                                                                <img src={file.icon} alt={name} className="w-6" />
                                                                <span className='w-72 truncate capitalize text-sm'>{name}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                    </>
                            }
                        </div>
                        <p
                            className="text-center py-0.5 bg-red-dark text-red border border-red-light rounded-xl w-fit px-4 text-xs mx-auto cursor-pointer"
                            onClick={() => openImageViewer(0)}
                        >
                            View All
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProfilePanel