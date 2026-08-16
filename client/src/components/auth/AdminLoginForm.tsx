import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import { useAdminLoginMutation } from '@/hooks/admin';
import type { AdminLoginForm } from '@/types/auth';
import { validateAdminSecret } from '@/utils/authValidators';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const OPS_TOOLS = [
  {
    label: 'Dashboard',
    desc: 'Stats & trends',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: 'Users',
    desc: 'Accounts & access',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M2.5 17c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M14.5 6.5a2 2 0 100-4 2 2 0 000 4zM17 15.5c0-2-1.5-3.2-3-3.2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: 'Messages',
    desc: 'Moderation queue',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M3 4.5h14v8a1.5 1.5 0 01-1.5 1.5H8l-3.5 2.5V14H4.5A1.5 1.5 0 013 12.5v-8z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Activity',
    desc: 'Live presence',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M4 14l3.5-4.5 3 2.5L14 6l2 2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="2.5" y="3" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
] as const;

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
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Invalid secret key',
      );
    }
  };

  return (
    <div className="auth-admin-body w-full text-left">
      <div className="flex items-start gap-3.5">
        <span className="auth-admin-shield grid h-12 w-12 shrink-0 place-items-center rounded-2xl">
          <svg className="h-6 w-6 text-blue" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-3z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 12l1.8 1.8L15 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="min-w-0 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue/85">
              Admin
            </p>
            <span className="rounded-full bg-blue/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue ring-1 ring-blue/20">
              Restricted
            </span>
          </div>
          <h2 className="mt-1 font-display text-[1.65rem] leading-none tracking-tight text-white">
            Ops console
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-body-300">
            Secret key unlocks moderation tools.
          </p>
        </div>
      </div>

      <div className="auth-admin-tools mt-5 grid grid-cols-2 gap-2">
        {OPS_TOOLS.map((tool) => (
          <div key={tool.label} className="auth-admin-tool flex items-center gap-2.5 px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue/10 text-blue ring-1 ring-blue/15">
              {tool.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-body">{tool.label}</p>
              <p className="truncate text-[10px] text-body-300/65">{tool.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="auth-admin-divider my-5" aria-hidden />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <AuthSubmit pending={login.isPending} className="mt-1">
          Enter dashboard
        </AuthSubmit>

        {login.isError ? (
          <p className="text-xs text-red" role="alert">
            {login.error instanceof Error
              ? login.error.message
              : 'Login failed. Check your secret key and that the API is reachable.'}
          </p>
        ) : null}

        <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-body-300/55">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path
              d="M7 9V6.5a3 3 0 016 0V9"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          Isolated session · httpOnly cookie
        </p>

        <Link
          to="/auth"
          className="text-center text-sm text-body-300 transition hover:text-green focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
        >
          ← Login as user
        </Link>
      </form>
    </div>
  );
};

export default AdminLogin;
