import avatar from '@/assets/avatar.png';
import { useForm } from 'react-hook-form';
import InputField from '@/shared/components/ui/InputField';
import Button from '@/shared/components/ui/Button';
import { validateAdminSecret } from '@/features/auth/validators';
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
        className="mx-auto h-24 w-24 rounded-full border-4 p-3 shadow-lg sm:h-[10rem] sm:w-[10rem] sm:p-4"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-6 flex w-full max-w-sm flex-col items-center gap-4 px-2 sm:my-8 sm:w-4/5 lg:w-3/5"
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
