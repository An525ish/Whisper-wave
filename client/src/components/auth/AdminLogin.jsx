import avatar from '@/assets/avatar.png'
import { useForm } from 'react-hook-form';
import InputField from '../ui/InputField';
import { validatePassword } from '@/lib/validators';
import { Link } from 'react-router-dom';

const AdminLogin = () => {

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

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 items-center w-4/5 lg:w-3/5 mx-auto my-8'>
                <InputField
                    type="password"
                    name="secretkey"
                    placeholder='Secret Key'
                    register={register}
                    validate={validatePassword}
                    errors={errors}
                />

                <button type='submit' className='px-4 py-2 rounded-3xl w-full outline-none bg-gradient-action-button-green mt-4 hover:scale-95 ease-linear'>Sign In</button>

                {false && <p className='text-xs w-full text-red'>We cannot find the secret key</p>}

                <Link to={'/auth'}>
                    <p className='text-base w-full mt-4 text-green cursor-pointer'>
                        <span className='mr-2'>⟨</span> Login as User
                    </p>
                </Link>
            </form>
        </div>
    )
}

export default AdminLogin