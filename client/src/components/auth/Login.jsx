import avatar from '@/assets/avatar.png'
import { useForm } from 'react-hook-form';
import InputField from '../ui/InputField';
import { postRequest } from '@/utils/api';
import { useDispatch } from 'react-redux';
import { userExist } from '@/redux/reducers/auth';
import toast from 'react-hot-toast';

const Login = ({ setIsLogin, setIsForget }) => {
    const dispatch = useDispatch()

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        mode: 'onChange', defaultValues: {
            username: 'Cleveland6',
            password: 'password123'
        }
    });

    const onSubmit = async (data) => {
        try {
            const response = await postRequest('/auth/signIn', data);
            dispatch(userExist(response.data))
            toast.success(response.message)
        } catch (error) {
            toast.error(error?.message || 'Something went wrong')
        }
    };

    return (
        <div className='w-full'>
            <img src={avatar} alt="" className='h-[10rem] w-[10rem] mx-auto border-4 rounded-full p-4 shadow-lg' />

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 items-center w-4/5 lg:w-3/5 mx-auto my-8'>
                <InputField
                    type="text"
                    name="username"
                    placeholder='Username'
                    register={register}
                    errors={errors}
                />

                <InputField
                    type="password"
                    name='password'
                    placeholder='Password'
                    register={register}
                    errors={errors}
                />

                <button className='px-4 py-2 rounded-3xl w-full outline-none bg-gradient-action-button-green mt-4 hover:scale-95 ease-linear'>Login</button>

                <p className='text-xs w-full italic text-right hover:text-blue cursor-pointer'
                    onClick={() => setIsForget(true)}>Forget your Password ?</p>

                <p className='text-base w-full mt-4'>Don’t have an account ? <span className=' text-green cursor-pointer' onClick={() => setIsLogin(false)}>Sign Up</span></p>
            </form>
        </div>
    )
}

export default Login