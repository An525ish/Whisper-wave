import AuthField from '@/components/auth/AuthField';
import AuthLoginFaces from '@/components/auth/AuthLoginFaces';
import AuthSubmit from '@/components/auth/AuthSubmit';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useSignInMutation } from '@/hooks/auth';
import type { LoginForm } from '@/types/auth';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type LoginProps = {
  setIsLogin: (value: boolean) => void;
  setIsForget: (value: boolean) => void;
};

const Login = ({ setIsLogin, setIsForget }: LoginProps) => {
  const signIn = useSignInMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ mode: 'onChange' });

  const onSubmit = async (data: LoginForm) => {
    try {
      await signIn.mutateAsync(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    }
  };

  return (
    <div className="auth-face-body flex h-full flex-col text-left">
      <AuthLoginFaces />

      <h2 className="mt-5 font-display text-[1.7rem] leading-none tracking-tight text-white">
        Welcome back
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-body-300">
        Slip back into the quiet. Your chats are waiting.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-5 flex flex-1 flex-col gap-3.5"
      >
        <AuthField
          type="text"
          name="username"
          label="Username"
          placeholder="Your username"
          autoComplete="username"
          register={register}
          errors={errors}
        />

        <AuthField
          type="password"
          name="password"
          label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          register={register}
          errors={errors}
        />

        <div className="-mt-0.5 flex justify-end">
          <button
            type="button"
            className="text-xs text-body-300 underline-offset-4 transition hover:text-green hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
            onClick={() => setIsForget(true)}
          >
            Forgot password?
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          <AuthSubmit pending={signIn.isPending}>Sign in</AuthSubmit>
          <GoogleSignInButton disabled={signIn.isPending} />
          <p className="mt-2 pb-0.5 text-center text-sm text-body-300">
            New here?{' '}
            <button
              type="button"
              className="font-semibold text-green transition hover:brightness-110 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
              onClick={() => setIsLogin(false)}
            >
              Create an account
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
