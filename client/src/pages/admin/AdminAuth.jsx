import AdminLogin from '@/components/auth/AdminLogin';

export default function AdminAuth() {

    return (
        <div className="h-[100vh]">
            <div className='flex items-center h-full text-center justify-center py-10'>
                <div className='flex-[1] grid place-items-center h-full'>
                    {
                        <AdminLogin />
                    }
                </div>
                <div className='hidden md:block h-full w-[1px] bg-border rotate-180'></div>
                <div className='md:flex-[1] lg:flex-[2] md:block hidden font-bold text-[4rem] lg:text-[5rem]'>
                    {'Hello Admin'}
                </div>
            </div>
        </div>
    )
}