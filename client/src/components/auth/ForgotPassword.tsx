import avatar from '@/assets/avatar.png';
import { useForm } from 'react-hook-form';
import InputField from '../ui/InputField';
import Button from '../ui/Button';
import { validateEmail } from '@/lib/validators';

type ForgotPasswordProps = {
  setIsForget: (value: boolean) => void;
};

type ForgotPasswordForm = {
  email: string;
};

const ForgotPassword = ({ setIsForget }: ForgotPasswordProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ mode: 'onChange' });

  const onSubmit = async (_data: ForgotPasswordForm) => {
    try {
      // Password reset API not implemented yet
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  return (
    <div className="w-full">
      <img
        src={avatar}
        alt=""
        className="mx-auto h-24 w-24 rounded-full border-4 p-3 shadow-lg sm:h-[10rem] sm:w-[10rem] sm:p-4"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-6 flex w-full max-w-sm flex-col items-center gap-4 px-2 sm:my-8 sm:w-4/5 lg:w-3/5"
      >
        <InputField
          type="email"
          name="email"
          placeholder="Email"
          register={register}
          validate={validateEmail}
          errors={errors}
        />

        <Button type="submit" className="mt-4 w-full">
          Submit
        </Button>

        {false && (
          <p className="text-xs w-full text-red">We cannot find your mail</p>
        )}

        <p
          className="text-base w-full mt-4 text-blue cursor-pointer"
          onClick={() => setIsForget(false)}
        >
          <span className="mr-2">⟨</span> Back to Login
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
