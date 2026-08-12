import ForgotPassword from '@/components/auth/ForgotPassword';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import { useState } from 'react';

export default function Auth() {

    const [isLogin, setIsLogin] = useState(true)
    const [isForget, setIsForget] = useState(false)

    return (
        <div className="h-dvh">
        <div className="flex h-full items-center justify-center px-4 py-6 text-center sm:py-10">
                <div className="grid h-full min-h-0 flex-1 place-items-center">
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
                <div className="mx-2 hidden h-full w-px rotate-180 bg-border md:block"></div>
                <div className="hidden font-bold md:block md:flex-1 md:text-[3.25rem] lg:flex-[2] lg:text-[5rem]">
                    {isLogin ? 'Welcome Back' : 'New Here ?'}
                </div>
            </div>
        </div>
    )
}