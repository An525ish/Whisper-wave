import InputField from '../ui/InputField'
import { useForm } from 'react-hook-form';
import { validateFullname, validatePassword, validateUsername } from '@/lib/validators';
import AvatarInput from '../ui/AvatarInput';
import { postRequest } from '@/utils/api';
import { useState } from 'react'
import { useDispatch } from 'react-redux';
import { userExist } from '@/redux/reducers/auth';
import toast from 'react-hot-toast';

const Register = ({ setIsLogin }) => {
    const [avatar, setAvatar] = useState(null)
    const dispatch = useDispatch()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({ mode: 'onChange' });

    const onSubmit = async (data) => {
        try {
            const response = await postRequest('/auth/signUp', { avatar, ...data }, { 'Content-Type': 'multipart/form-data' });
            toast.success(response.message)
            dispatch(userExist(response.data))
        } catch (error) {
            toast.error(error?.message || 'Something went wrong')
        }
    };

    return (
        <div className='w-full'>
            <div className='flex justify-center'>
                <AvatarInput
                    file={avatar}
                    setFile={setAvatar}
                />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 items-center w-4/5 lg:w-3/5 mx-auto my-8'>
                <InputField
                    type="text"
                    name='name'
                    placeholder='Fullname'
                    register={register}
                    validate={validateFullname}
                    errors={errors}
                />
                <InputField
                    type="text"
                    name="username"
                    placeholder='username'
                    register={register}
                    validate={validateUsername}
                    errors={errors}
                />
                <InputField
                    type="password"
                    name='password'
                    placeholder='Password'
                    register={register}
                    validate={validatePassword}
                    errors={errors}
                />
                <InputField
                    type="password"
                    name='confirmPassword'
                    placeholder='Confirm Password'
                    register={register}
                    validate={(value) => {
                        return value === watch('password') || "Passwords do not match";
                    }}
                    errors={errors}
                />

                <button className='px-4 py-2 rounded-3xl w-full outline-none bg-gradient-action-button-green mt-4 hover:scale-95 ease-linear'>Register</button>

                <p className='text-base w-full mt-4'>Already have an account ? <span className=' text-green cursor-pointer' onClick={() => setIsLogin(true)}>Sign In</span></p>
            </form>
        </div>
    )
}

export default Register