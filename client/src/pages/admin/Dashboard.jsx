import BarChart from '@/components/charts/BarChart';
import SingleAreaChart from '@/components/charts/SingleAreaeChart';
import avatar from '@/assets/avatar.png';
import AreaChart from "@/components/charts/AreaChart";
import AllocationChart from "@/components/charts/DoughnutChart";
import MembersIcon from "@/components/icons/Members";
import CreateGroupIcon from "@/components/icons/CreateGroup";
import ChatIcon from "@/components/icons/Chat";
import ArrowUp from "@/components/icons/ArrowUp";
import ArrowDown from "@/components/icons/ArrowDown";

const Dashboard = () => {

    const titleStats = [{
        title: 'Users',
        Icon: MembersIcon,
        value: 100
    },
    {
        title: 'Groups',
        Icon: CreateGroupIcon,
        value: 80
    },
    {
        title: 'Online Users',
        Icon: MembersIcon,
        value: 50,
        online: true,
    },
    {
        title: 'Chats',
        Icon: ChatIcon,
        value: 525
    }
    ]

    return (
        <div className='px-12 mt-4 w-full'>
            <div className='flex justify-around gap-4 text-body-700'>
                {titleStats.map(({ title, Icon, value, online }, i) =>
                    <div key={i} className='grid place-items-center text-center bg-gradient-idea-blue  border-2 border-blue-light shadow-md w-48 h-48 p-2 rounded-full'>
                        <div className="">
                            <div className="relative">
                                <Icon className={'w-10 mx-auto fill-blue-light stroke-blue-light'} />
                                {online && <div className="w-2 h-2 bg-blue absolute right-5 top-0 rounded-full animate-pulse"></div>}
                            </div>
                            <p className='text-2xl font-semibold my-4'>{value}</p>
                            <p className='text font-medium'>{title}</p>
                        </div>
                        {/* <div className='max-w-fit'>
                                <img src={'chart'} alt="" className='' />
                            </div> */}
                    </div>)}
            </div>

            <div className='flex text-body-700 justify-between gap-12 mt-12'>
                <div className='w-3/5 h-[20rem]'>
                    <p className='flex gap-4 border-b border-border pb-2 mb-4 text-xl font-semibold'>New Users <span className='text-green'><ArrowUp className={'inline-block mr-1'} /> 0.3%</span></p>
                    <AreaChart />
                </div>
                <div className='w-2/5 h-[20rem]'>
                    <p className='flex gap-4 border-b border-border pb-2 mb-4 text-xl font-semibold'>Premium Users <span className='text-red'><ArrowDown className={'inline-block mr-1'} /> 0.3%</span></p>
                    <BarChart />
                </div>
            </div>

            <div className='flex justify-between text-body-700 gap-14 mt-20'>
                <div className='w-full '>
                    <div className='flex justify-between border-b border-border mb-4  pb-2'>
                        <p className='font-semibold text-xl'>Sales</p>
                    </div>
                    <div className=''>
                        <AllocationChart />
                    </div>
                    <div>
                        <div className='text-sm mt-4'>
                            <p className='flex justify-between'>
                                <span>Current Week</span>
                                <span>2000</span>
                                <span className='text-green-500'><ArrowUp className={'inline-block mr-1'} /> 0.3%</span>
                            </p>
                            <p className='flex justify-between'><span>Last Week</span>
                                <span className='ml-5'>1500</span>
                                <span className='text-red-500'><ArrowDown className={'inline-block mr-1'} /> 0.3%</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className='w-full '>
                    <div className='flex justify-between border-b border-border mb-4  pb-2'>
                        <p className='font-semibold text-xl'>Weekly Sales Stats</p>
                    </div>
                    <div>
                        <div className='mb-8 h-[10rem]'>
                            <SingleAreaChart />
                        </div>
                        {Array(3).fill(0).map((_, i) =>
                            <div key={i} className='flex justify-between items-center mt-2'>
                                <div className="flex items-center gap-12 text-left ">
                                    <div className='w-10 h-10 rounded-sm overflow-hidden bg-slate-700'>
                                        <img src={avatar} alt="" />
                                    </div>
                                    <div className="">
                                        <p className="mb-1 text-sm font-medium">{`Python Bootcamp`}</p>
                                        <p className='text-grey text-xs'> Development
                                        </p>
                                    </div>
                                </div>
                                <div className=''>
                                    <button className='bg-purple-300 text-purple-700 py-1 px-2 rounded-sm overflow-hidden mr-4'>
                                        $20
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className='w-full '>
                    <div className='flex justify-between border-b border-border mb-4 pb-2'>
                        <p className='font-semibold text-xl'>Sponsors</p>
                    </div>
                    <div className="w-full">
                        {Array(4).fill(0).map((_, i) =>
                            <div key={i} className='flex w-full justify-between items-center mt-4'>
                                <div className="flex items-center gap-4 text-left ">
                                    <div className='w-10 h-10 rounded-sm overflow-hidden bg-slate-700'>
                                        <img src={avatar} alt="" />
                                    </div>
                                    <div className="">
                                        <p className="mb-1 text-sm font-medium">{`Python Bootcamp`}</p>
                                        <p className='text-grey text-xs'> Development
                                        </p>
                                    </div>
                                </div>
                                <div className='text-right self-baseline'>
                                    <button className='border border-green-light rounded-md text-green py-1 px-4 w-24 inline-block'>
                                        View
                                    </button>
                                    <button className='border border-red-light rounded-md text-red py-1 px-4 w-24 mt-2 inline-block'>
                                        Decline
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard