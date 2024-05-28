import { useState } from 'react';
import Searchbar from '../Searchbar';
import CreateGroupIcon from '@/components/icons/CreateGroup';
import GroupChatDialog from './groupChatPanel/GroupChatDialog';

const ChatHeader = () => {

    const [searchText, setSearchText] = useState('');
    const [isCreateGroup, setIsCreateGroup] = useState(false);

    const handlToggle = () => setIsCreateGroup(prev => !prev)

    return (
        <div className='relative'>
            <div className="w-full flex justify-between items-center p-2">
                <p className="text-2xl font-semibold text-white flex items-center gap-2">
                    Messages
                    <span className="bg-red-dark border border-red-light text-red font-normal text-sm rounded-full w-6 h-6 text-center grid place-items-center">5</span>
                </p>

                <div className='flex items-center gap-4'>
                    <div className='cursor-pointer'>
                        <Searchbar searchText={searchText} setSearchText={setSearchText} />
                    </div>
                    <div className='z-50 cursor-pointer' onClick={handlToggle}>
                        <CreateGroupIcon className={'w-6'} />
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