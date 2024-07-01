import { fileFormat } from '@/lib/features';
import dayjs from 'dayjs';
import RenderAttachments from './RenderAttachments';
import { useSelector } from 'react-redux';
import Image from '@/components/ui/Image';

const ChatBox = ({ chatData, isGroupChat }) => {
    const { content, sender, attachments = [], createdAt } = chatData

    const { user } = useSelector(state => state.auth)
    const sameSender = sender._id === user._id
    const currentTime = dayjs(createdAt).format('hh:mm A');

    return (
        <>
            {attachments.length > 0 &&
                <div className={`w-fit flex flex-col gap-3`}>
                    {attachments.map((attachment, index) => {
                        const url = attachment.url || attachment.tempUrl;
                        const fileType = fileFormat(url);
                        const isUploading = attachment.uploading

                        return (
                            <a
                                key={attachment.public_id || index}
                                href={url}
                                target='_blank'
                            >
                                <div className='relative grid place-items-center rounded-lg'>
                                    <RenderAttachments
                                        fileType={fileType}
                                        url={url}
                                        name={attachment.name}
                                        type={attachment.type}
                                        size={attachment.size}
                                        isUploading={isUploading}
                                    />
                                    <p className='absolute shadow-lg bottom-0 right-2 text-xs text-body-700 text-right self-end justify-self-end whitespace-nowrap'>{currentTime}</p>
                                </div>
                            </a>
                        );
                    })}
                </div>
            }

            {(attachments.length === 0 || content) &&
                (
                    <div className={`border-2 border-green-light py-2 pr-4 rounded-b-xl ${sameSender ? 'rounded-s-[2rem] self-end pl-4' : 'rounded-e-[2rem] pl-3 self-start'} shadow-lg flex gap-3 items-center`}>

                        <div className={`${isGroupChat ? 'block' : 'hidden'}`}>
                            {isGroupChat && <div className='border-none w-10 h-10 rounded-full overflow-hidden'>
                                <Image src={sender.avatar} className={'w-full'} />
                            </div>}
                        </div>

                        <div>
                            <p className="Capitalize text-green font-medium tracking-wider">{sender.name}</p>

                            <div className='grid grid-cols-[1fr,auto] gap-4'>
                                <p className="text-sm text-body-700 break-words">{content}</p>
                                <p className='text-xs text-body-300 mt-4 text-right self-end justify-self-end whitespace-nowrap'>{currentTime}</p>
                            </div>
                        </div>

                    </div>
                )
            }

        </>
    )
}

export default ChatBox