import { useState } from 'react';
import Searchbar from '../Searchbar';

const ChatHeader = () => {

    const [searchText, setSearchText] = useState('');


    return (
        <div className="w-full flex justify-between items-center p-2">
            <p className="text-2xl font-semibold text-white flex items-center gap-2">
                Messages
                <span className="bg-red-dark border border-red-light text-red font-normal text-sm rounded-full w-6 h-6 text-center grid place-items-center">5</span>
            </p>
            <div className='cursor-pointe'>
                {/* <img src={searchIcon} alt="" /> */}
                <Searchbar searchText={searchText} setSearchText={setSearchText} />
            </div>
        </div>
    )
}

export default ChatHeader