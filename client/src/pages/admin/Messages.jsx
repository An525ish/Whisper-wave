import avatar from '@/assets/avatar.png';
import Table from "@/components/tables/Table";
import Searchbar from "@/components/ui/searchbar/Searchbar";
import { useState } from "react";

const Messages = () => {

    let tableData = [];
    for (let i = 0; i <= 5; i++) {
        tableData.push([
            <>
                <div className="flex items-center justify-center gap-2 text-left">
                    <div className='w-8 h-8 rounded-sm  overflow-hidden bg-slate-700'>
                        <img src={avatar} alt="" />
                    </div>
                    <div className="">
                        <p className="mb-1 text-xs font-medium">{`Python Bootcamp`}</p>
                        <p className='text-grey text-xxs'> Development
                        </p>
                    </div>
                </div>
            </>,
            <>
                <p>{'Design'}</p>
            </>,
            <>
                <p>{'150'}</p>
            </>,
            <>
                <p className=''> {'⭐4.5'}</p>
            </>,
            <>
                <p className=''> {'$610.50'}</p>
            </>,
            <>
                <p className=''> {'24,512'}</p>
            </>
        ]);
    }

    const [searchText, setSearchText] = useState('')

    return (
        <div className=''>
            <p className='font-medium border-b full-border w-fit text-2xl mx-auto px-12 py-2 mb-12'>Messages Status</p>

            <div className="w-full px-12 mb-8">
                <Searchbar
                    className={'w-[18rem] mx-auto '}
                    searchText={searchText}
                    setSearchText={setSearchText}
                />
            </div>

            <Table
                header={['Message Id', 'Content', 'Sent By', 'Sender', 'Received By', 'Receiver']}
                // content={tableData}
                fixed={true}
            />

            {<p className="text-center w-full text-4xl font-medium">No Messages to Show</p>}
        </div>
    )
}

export default Messages