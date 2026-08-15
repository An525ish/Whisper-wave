import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import { useAdminLoginMutation } from '@/hooks/admin';
import type { AdminLoginForm } from '@/types/auth';
import { validateAdminSecret } from '@/utils/authValidators';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

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
    <div className="w-full text-left">
      <h2 className="font-display text-[1.85rem] leading-none tracking-tight text-white">
        Ops console
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-body-300">
        Secret key unlocks the dashboard. Keep it quiet.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-7 flex flex-col gap-4"
      >
        <AuthField
          type="password"
          name="secretkey"
          label="Secret key"
          placeholder="Admin secret"
          autoComplete="current-password"
          register={register}
          validate={validateAdminSecret}
          errors={errors}
        />

        <AuthSubmit pending={login.isPending} className="mt-2">
          Enter dashboard
        </AuthSubmit>

        {login.isError ? (
          <p className="text-xs text-red" role="alert">
            We cannot find the secret key
          </p>
        ) : null}

        <Link
          to="/auth"
          className="mt-3 text-center text-sm text-body-300 transition hover:text-green focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
        >
          ← Login as user
        </Link>
      </form>
    </div>
  );
};

export default AdminLogin;
