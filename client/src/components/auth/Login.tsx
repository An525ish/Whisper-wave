import avatar from '@/assets/avatar.png';
import { useForm } from 'react-hook-form';
import InputField from '../ui/InputField';
import Button from '../ui/Button';
import { useSignInMutation } from '@/features/api/hooks';
import toast from 'react-hot-toast';

type LoginProps = {
  setIsLogin: (value: boolean) => void;
  setIsForget: (value: boolean) => void;
};

type LoginForm = {
  username: string;
  password: string;
};

const Login = ({ setIsLogin, setIsForget }: LoginProps) => {
  const signIn = useSignInMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    mode: 'onChange',
    defaultValues: {
      username: 'Cleveland6',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await signIn.mutateAsync(data);
      toast.success(response.message || 'Logged in');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    }
  };

  return (
    <div className="w-full">
      <img
        src={avatar}
        alt=""
        className="h-[10rem] w-[10rem] mx-auto border-4 rounded-full p-4 shadow-lg"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 items-center w-4/5 lg:w-3/5 mx-auto my-8"
      >
        <InputField
          type="text"
          name="username"
          placeholder="Username"
          register={register}
          errors={errors}
        />

        <InputField
          type="password"
          name="password"
          placeholder="Password"
          register={register}
          errors={errors}
        />

        <Button type="submit" className="mt-4 w-full">
          Login
        </Button>

        <p
          className="text-xs w-full italic text-right hover:text-blue cursor-pointer"
          onClick={() => setIsForget(true)}
        >
          Forget your Password ?
        </p>

        <p className="text-base w-full mt-4">
          Don’t have an account ?{' '}
          <span
            className=" text-green cursor-pointer"
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
