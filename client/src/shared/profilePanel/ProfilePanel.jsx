import Image from '@/components/ui/Image'
import Carousel from '@/components/ui/carousel/Carousel'
import { fileData } from '@/lib/features'
import { useChatDetailsQuery } from '@/redux/reducers/apis/api'
import { getFirstName } from '@/utils/helper'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

const ProfilePanel = () => {
    const { chatId } = useParams()
    const { user } = useSelector(state => state.auth)

    const { data: profileDetails, isLoading, error } = useChatDetailsQuery({
        id: chatId,
        populate: true
    }, { skip: !chatId })

    if (chatId) {
        if (isLoading) return <div>Loading...</div>
        if (error) return <div>Error loading profile: {error.message}</div>
        if (!profileDetails || !profileDetails.data) return <div>No profile data available</div>
    }

    const profileData = chatId ? profileDetails.data : user
    const { name, avatar, bio, creator, members, groupChat } = profileData

    const creatorName = creator ? getFirstName(creator.name) : 'Unknown'

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
                    <div className="flex gap-4 flex-wrap my-4 overflow-y-auto scrollbar-custom h-[11rem]">
                        {Array(9).fill(0).map((img, index) => <img key={index} src="https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250" alt="" className="w-[30%] h-20 bg-primary rounded-lg object-cover cursor-pointer hover:opacity-50 transition-opacity" />)}
                    </div>
                    <p className="text-center py-0.5 bg-red-dark text-red border border-red-light rounded-xl w-fit px-4 text-xs mx-auto cursor-pointer">View More</p>
                </div>

                <div className="px-4 mt-4">
                    <p className="px-2 text-body-700 capitalize border-0 border-b half-border pb-1">Attachments</p>
                    <div className="flex flex-wrap my-4 gap-2 overflow-y-scroll scrollbar-custom h-[7rem]">
                        {fileData.map((file) =>
                            <div key={file.id} className="w-full h-8 rounded-lg">
                                <p className="flex gap-4 items-center h-full w-[90%] cursor-pointer"><img src={file.icon} alt={file.docName} className="w-6" /><span className='capitalize text-sm'>{file.docName}</span></p>
                            </div>
                        )}
                    </div>
                    <p className="text-center py-0.5 bg-red-dark text-red border border-red-light rounded-xl w-fit px-4 text-xs mx-auto cursor-pointer">View More</p>
                </div>
            </div>
        </div>
    )
}

export default ProfilePanel