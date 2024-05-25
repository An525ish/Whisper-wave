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
                <div className='flex-[1] grid place-items-center border border-y-0 border-l-0 border-border h-full'>
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
                <div className='flex-[2] font-bold text-[5rem]'>
                    {isLogin ? 'Welcome Back' : 'New Here ?'}
                </div>
            </div>
        </div>
    )
}