import InputField from '../ui/InputField'
import { useForm } from 'react-hook-form';
import { validateFullname, validatePassword, validateUsername } from '@/lib/validators';
import Avatar from '../ui/Avatar';

const Register = ({ setIsLogin }) => {

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({ mode: 'onChange' });

    const onSubmit = async (data) => {
        try {
            console.log(data)
            //   const response = await axios.post('https://your-api-endpoint.com/register', data);
            //   console.log('Registration successful:', response.data);
        } catch (error) {
            console.error('Error registering user:', error);
            // Handle error (e.g., show error message to the user)
        }
    };

    return (
        <div className='w-full'>
            <div className='flex justify-center'>
                <Avatar />
            </div>

            <form action="" onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 items-center w-3/5 mx-auto my-8'>
                <InputField
                    type="text"
                    name='fullname'
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