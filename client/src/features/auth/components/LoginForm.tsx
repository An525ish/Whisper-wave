import avatar from '@/assets/avatar.png';
import { useForm } from 'react-hook-form';
import InputField from '@/shared/components/ui/InputField';
import Button from '@/shared/components/ui/Button';
import { useSignInMutation } from '@/features/chat/hooks';
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
        className="mx-auto h-24 w-24 rounded-full border-4 p-3 shadow-lg sm:h-40 sm:w-40 sm:p-4"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-6 flex w-full max-w-sm flex-col items-center gap-4 px-2 sm:my-8 sm:w-4/5 lg:w-3/5"
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
