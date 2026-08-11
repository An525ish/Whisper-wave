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
        className="h-[10rem] w-[10rem] mx-auto border-4 rounded-full p-4 shadow-lg"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 items-center w-4/5 lg:w-3/5 mx-auto my-8"
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
