import { fileFormat } from '@/lib/features';
import dayjs from 'dayjs';
import RenderAttachments from './RenderAttachments';
import { useSelector } from 'react-redux';
import Image from '@/components/ui/Image';

const ChatBox = ({ chatData, isGroupChat }) => {
    const { content, sender, attachments = [], createdAt } = chatData

    const { user } = useSelector(state => state.auth)
    const sameSender = sender._id === user._id
    // console.log(sameSender)
    const currentTime = dayjs(createdAt).format('hh:mm A');

    return (
        <>
            <div className={`max-w-[70%] w-fit border-2 border-green-light pl-2 py-2 pr-4 rounded-b-xl
         ${sameSender ? 'rounded-s-[2rem] self-end pl-4' : 'rounded-e-[2rem] self-start'} shadow-lg flex gap-3 items-center`}>

                <div className={`${isGroupChat ? 'block' : 'hidden'}`}>
                    {isGroupChat && <div className='w-10 h-10 rounded-full overflow-hidden'>
                        <Image src={sender.avatar} className={'w-full'} />
                    </div>}
                </div>

                <div>
                    <p className="Capitalize text-green font-medium tracking-wider">{sender.name}</p>

                    {attachments.length > 0 &&
                        attachments.map((attachment) => {
                            const url = attachment.url
                            const file = fileFormat(url)

                            return (
                                <div key={attachment.public_id} className='grid place-items-center p-1 rounded-lg my-2 w-[250px]'>
                                    <a
                                        href={url}
                                        target='_blank'
                                        className=''
                                    >
                                        <RenderAttachments file={file} url={url} />
                                    </a>
                                </div>)
                        })}

                    <div className='flex'>
                        <p className="text-sm text-body-700 w-full">{content}</p>
                        <p className='text-xs text-body-300 text-right self-end mt-4 w-20'>{currentTime}</p>
                    </div>
                </div>

            </div>

        </>
    )
}

export default ChatBox