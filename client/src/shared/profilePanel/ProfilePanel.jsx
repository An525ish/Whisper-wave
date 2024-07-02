import Image from '@/components/ui/Image'
import Carousel from '@/components/ui/carousel/Carousel'
import useErrors from '@/hooks/error'
import { useSocket } from '@/hooks/socketContext'
import useSocketEvent from '@/hooks/socketEvent'
import { fileData, fileFormat, transformImage } from '@/lib/features'
import { NEW_ATTACHMENT } from '@/lib/socketConstants'
import { useChatDetailsQuery, useGetMediaQuery } from '@/redux/reducers/apis/api'
import { getFirstName } from '@/utils/helper'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

const ProfilePanel = () => {
    const { chatId } = useParams()
    const socket = useSocket()

    const { user } = useSelector(state => state.auth)

    const { data: profileDetails, isLoading, error, isError } = useChatDetailsQuery({
        id: chatId,
        populate: true
    }, { skip: !chatId })

    const { data: media, isLoading: isMediaLoading, error: mediaError, isError: isMediaError, refetch } = useGetMediaQuery({ chatId }, { skip: !chatId })

    useErrors([{ error, isError }, { mediaError, isMediaError }])

    const newAttachmentListener = useCallback(() => {
        console.log('first')
        refetch()
    }, [refetch],
    )

    const events = {
        [NEW_ATTACHMENT]: newAttachmentListener
    }

    useSocketEvent(socket, events)

    if (chatId) {
        if (isLoading || isMediaLoading) return <div>Loading...</div>
        if (!profileDetails || !profileDetails.data) return <div>No profile data available</div>
    }

    const profileData = chatId ? profileDetails.data : user
    const { name, avatar, bio, creator, members, groupChat } = profileData

    const creatorName = creator ? getFirstName(creator.name) : 'Unknown'

    const mediaData = media?.data || []
    const mediaFiles = mediaData.filter((file) => file.fileType !== 'document')
    const docFiles = mediaData.filter((file) => file.fileType === 'document')

    return (
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
                            mediaFiles.length === 0 ?
                                <div className='grid place-items-center w-full'>
                                    <div className='w-full'>
                                        <img src="/images/no-media.svg"
                                            alt="no-media"
                                            className='w-20 mx-auto opacity-50'
                                        />
                                        <p className='text-center text-body-300 text-sm mt-4'>No Media Found</p>
                                    </div>
                                </div>
                                : mediaFiles.splice(0, 8).map(({ _id, url, name }) => {
                                    const transformedUrl = transformImage(url)
                                    const fileExtension = fileFormat(url)

                                    return (
                                        <a
                                            key={_id}
                                            href={url}
                                            target='_blank'
                                        >
                                            {
                                                fileExtension === 'image' ?
                                                    <div className='hover:opacity-50 transition-opacity cursor-pointer'>
                                                        <Image
                                                            src={transformedUrl}
                                                            alt={name}
                                                            className="w-24 h-20 bg-primary rounded"
                                                        />
                                                    </div>
                                                    :
                                                    <div className='cursor-pointer hover:opacity-50 transition-opacity'>
                                                        <video
                                                            src={transformedUrl}
                                                            className='w-24 h-20 bg-primary object-cover rounded-lg'
                                                        />
                                                    </div>
                                            }
                                        </a>
                                    )
                                })}
                    </div>
                    <p className="text-center py-0.5 bg-red-dark text-red border border-red-light rounded-xl w-fit px-4 text-xs mx-auto cursor-pointer">View All</p>
                </div>

                <div className="px-4 mt-4">
                    <p className="px-2 text-body-700 capitalize border-0 border-b half-border pb-1">Attachments</p>
                    <div className="flex flex-col gap-2 my-4 overflow-y-scroll scrollbar-custom max-h-[7rem]">
                        {
                            docFiles.length === 0 ?
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
                                        <a
                                            key={_id}
                                            href={url}
                                            target='_blank'
                                        >
                                            <div className="w-full h-8 rounded-lg">
                                                <p className="flex gap-4 items-center h-full w-[90%] cursor-pointer">
                                                    <img src={file.icon} alt={name} className="w-6" />
                                                    <span className='w-72 truncate capitalize text-sm'>{name}</span>
                                                </p>
                                            </div>
                                        </a>
                                    )
                                })
                        }
                    </div>
                    <p className="text-center py-0.5 bg-red-dark text-red border border-red-light rounded-xl w-fit px-4 text-xs mx-auto cursor-pointer">View All</p>
                </div>
            </div>
        </div>
    )
}

export default ProfilePanel