import { useState } from 'react';
import Searchbar from '../Searchbar';
import CreateGroupIcon from '@/components/icons/CreateGroup';
import GroupChatDialog from './createGroupPanel/CreateGroupDialog';
import { useSelector } from 'react-redux';

const ChatHeader = ({ searchText, setSearchText }) => {

    const [isCreateGroup, setIsCreateGroup] = useState(false);
    const { messageNotifications } = useSelector(state => state.chat)

    const handlToggle = () => setIsCreateGroup(prev => !prev)

    return (
        <div className='relative'>
            <div className="w-full flex justify-between items-center p-2">
                <p className="text-2xl font-semibold text-white flex items-center gap-2">
                    <img src="/logo-4.png" alt="icon" className="w-12" />
                    Messages
                    {messageNotifications.length > 0 && <span
                        className={`bg-red-dark border border-red-light text-red font-normal text-xs rounded-full ${messageNotifications.length < 9 ? 'w-6' : 'w-fit'} px-1 py-0.5 h-6 text-center grid place-items-center`}>
                        {
                            messageNotifications.length > 99 ? '99+' : messageNotifications.length
                        }
                    </span>}
                </p>

                <div className='flex items-center gap-4'>
                    <div className='cursor-pointer'>
                        <Searchbar searchText={searchText} setSearchText={setSearchText} />
                    </div>
                    <div className='z-20 cursor-pointer' onClick={handlToggle}>
                        <CreateGroupIcon className={'w-6 fill-white'} />
                    </div>
                </div>
            </div>

            {isCreateGroup && (
                <div className='mt-4'>
                    <GroupChatDialog isCreateGroup={isCreateGroup} setIsCreateGroup={setIsCreateGroup} />
                </div>
            )}
        </div>
    )
}

export default ChatHeader