import { useState } from 'react';
import ChatHeader from './ChatListHeader'
import ChatTabView from './ChatTabView'

const ChatListPanel = () => {
    const [searchText, setSearchText] = useState('');

    return (
        <div className='w-[25rem]'>
            <ChatHeader searchText={searchText} setSearchText={setSearchText} />
            <ChatTabView searchText={searchText} />
        </div>
    )
}

export default ChatListPanel