import { useState } from 'react';
import ChatHeader from './ChatListHeader'
import ChatTabView from './ChatTabView'
import AddMemberIcon from '@/components/icons/AddMember';
import AddFriendsDialog from './addFriendsPanel/AddFriendsDialog';

const ChatListPanel = () => {
    const [searchText, setSearchText] = useState('');
    const [isClicked, setIsClicked] = useState(false)

    return (
        <div className='relative w-[25rem]'>
            <ChatHeader searchText={searchText} setSearchText={setSearchText} />

            {isClicked &&
                <div className='mt-6'>
                    <AddFriendsDialog isOpen={isClicked} setIsClicked={setIsClicked} />
                </div>
            }

            <ChatTabView searchText={searchText} />

            {!isClicked && <button
                className="absolute bottom-7 right-6 p-3 border border-border group-hover:border-green-light bg-gradient-background transition rounded-full"
                onClick={() => setIsClicked(prev => !prev)}
            >
                <AddMemberIcon className={'w-8 h-8 transition fill-green group-hover:fill-green'} />
            </button>}
        </div>
    )
}

export default ChatListPanel