import avatar from '@/assets/avatar.png';
import { useForm } from 'react-hook-form';
import InputField from '../ui/InputField';
import Button from '../ui/Button';
import { validateAdminSecret } from '@/lib/validators';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminLoginMutation } from '@/features/admin/hooks';
import toast from 'react-hot-toast';

type AdminLoginForm = {
  secretkey: string;
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const login = useAdminLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({ mode: 'onChange' });

  const onSubmit = async (data: AdminLoginForm) => {
    try {
      await login.mutateAsync(data.secretkey);

      toast.success('Welcome Admin');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Invalid secret key',
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
          type="password"
          name="secretkey"
          placeholder="Secret Key"
          register={register}
          validate={validateAdminSecret}
          errors={errors}
        />

        <Button type="submit" className="mt-4 w-full">
          Sign In
        </Button>

        {login.isError && (
          <p className="text-xs w-full text-red">We cannot find the secret key</p>
        )}

        <Link to={'/auth'}>
          <p className="text-base w-full mt-4 text-green cursor-pointer">
            <span className="mr-2">⟨</span> Login as User
          </p>
        </Link>
      </form>
    </div>
  );
};

export default AdminLogin;
