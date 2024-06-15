import avatar from '@/assets/avatar.png';
import Table from "@/components/tables/Table";
import Searchbar from "@/components/ui/searchbar/Searchbar";
import { useState } from "react";

const Users = () => {

    let tableData = [];
    for (let i = 0; i <= 5; i++) {
        tableData.push([
            <>
                <p className='text-center'> {'fs3r4uro23ir323r23rj34rngi'}</p>
            </>,
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
                <p>{'@An525ish'}</p>
            </>,
            <>
                <p>{'150'}</p>
            </>,
            <>
                <p className=''> {'23'}</p>
            </>,
            <>
                <p className=''> {'250'}</p>
            </>,
        ]);
    }

    const [searchText, setSearchText] = useState('')

    return (
        <div className=''>
            <p className='font-medium border-b full-border w-fit text-2xl mx-auto px-12 py-2 mb-12'>Users Status</p>

            <div className="w-full px-12 mb-8">
                <Searchbar
                    className={'w-[18rem] mx-auto '}
                    searchText={searchText}
                    setSearchText={setSearchText}
                />
            </div>

            <Table
                header={['User Id', 'Name', 'Username', 'Friends', 'Groups', 'Attachments']}
                content={tableData}
                fixed={false}
            />
        </div>
    )
}

export default Users