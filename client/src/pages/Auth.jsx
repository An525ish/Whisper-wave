import ForgotPassword from '@/components/auth/ForgotPassword';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import { useState } from 'react';

export default function Auth() {

    const [isLogin, setIsLogin] = useState(true)
    const [isForget, setIsForget] = useState(false)

    return (
        <div className="h-[100vh]">
            <div className='flex items-center h-full text-center justify-center py-10'>
                <div className='flex-[1] grid place-items-center h-full'>
                    {
                        isForget ?
                            <ForgotPassword setIsForget={setIsForget} /> :
                            isLogin ? <Login
                                setIsLogin={setIsLogin}
                                setIsForget={setIsForget}
                            /> : <Register
                                setIsLogin={setIsLogin}
                            />
                    }
                </div>
                <div className='hidden md:block h-full w-[1px] bg-border rotate-180'></div>
                <div className='md:flex-[1] lg:flex-[2] md:block hidden font-bold text-[4rem] lg:text-[5rem]'>
                    {isLogin ? 'Welcome Back' : 'New Here ?'}
                </div>
            </div>
        </div>
    )
}