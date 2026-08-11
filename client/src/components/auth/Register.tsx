import InputField from '../ui/InputField';
import Button from '../ui/Button';
import { useForm } from 'react-hook-form';
import {
  validateFullname,
  validatePassword,
  validateUsername,
} from '@/lib/validators';
import AvatarInput from '../ui/AvatarInput';
import { useState } from 'react';
import { useSignUpMutation } from '@/features/api/hooks';
import toast from 'react-hot-toast';

type RegisterProps = {
  setIsLogin: (value: boolean) => void;
};

type RegisterForm = {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
};

const Register = ({ setIsLogin }: RegisterProps) => {
  const [avatar, setAvatar] = useState<File | null>(null);
  const signUp = useSignUpMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({ mode: 'onChange' });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('username', data.username);
      formData.append('password', data.password);
      if (avatar) formData.append('avatar', avatar);

      const response = await signUp.mutateAsync(formData);
      toast.success(response.message || 'Registered');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <AvatarInput file={avatar} setFile={setAvatar} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 items-center w-4/5 lg:w-3/5 mx-auto my-8"
      >
        <InputField
          type="text"
          name="name"
          placeholder="Fullname"
          register={register}
          validate={validateFullname}
          errors={errors}
        />
        <InputField
          type="text"
          name="username"
          placeholder="username"
          register={register}
          validate={validateUsername}
          errors={errors}
        />
        <InputField
          type="password"
          name="password"
          placeholder="Password"
          register={register}
          validate={validatePassword}
          errors={errors}
        />
        <InputField
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          register={register}
          validate={(value) => {
            return value === watch('password') || 'Passwords do not match';
          }}
          errors={errors}
        />

        <Button type="submit" className="mt-4 w-full">
          Register
        </Button>

        <p className="text-base w-full mt-4">
          Already have an account ?{' '}
          <span
            className=" text-green cursor-pointer"
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
