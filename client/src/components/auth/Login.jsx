import avatar from '@/assets/avatar.png'
import { useForm } from 'react-hook-form';
import InputField from '../ui/InputField';
import { validatePassword, validateUsername } from '@/lib/validators';

const Login = ({ setIsLogin, setIsForget }) => {

    const {
        register,
        handleSubmit,
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
            <img src={avatar} alt="" className='h-[10rem] w-[10rem] mx-auto border-4 rounded-full p-4 shadow-lg' />

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 items-center w-3/5 mx-auto my-8'>
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
                    placeholder='password'
                    register={register}
                    validate={validatePassword}
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