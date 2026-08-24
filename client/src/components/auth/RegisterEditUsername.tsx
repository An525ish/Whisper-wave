import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import UsernameStatusBadge from '@/components/auth/UsernameStatusBadge';
import { useUsernameAvailability } from '@/hooks/auth/useUsernameAvailability';
import type { RegisterEditUsernameForm } from '@/types/auth';
import { validateUsername } from '@/utils/authValidators';
import { useForm } from 'react-hook-form';

type RegisterEditUsernameProps = {
  currentUsername: string;
  pending: boolean;
  onSubmit: (data: RegisterEditUsernameForm) => Promise<void>;
  onBack: () => void;
  cta: string;
};

const RegisterEditUsername = ({
  currentUsername,
  pending,
  onSubmit,
  onBack,
  cta,
}: RegisterEditUsernameProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterEditUsernameForm>({
    mode: 'onChange',
    defaultValues: { username: currentUsername },
  });

  const usernameValue = watch('username');
  // Pass currentUsername so we skip the check when the user hasn't changed it
  const availabilityStatus = useUsernameAvailability(usernameValue, currentUsername);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-5 flex flex-1 flex-col gap-3"
    >
      <div>
        <AuthField
          type="text"
          name="username"
          label="Username"
          placeholder="your_handle"
          autoComplete="username"
          register={register}
          validate={validateUsername}
          errors={errors}
        />
        {!errors.username && <UsernameStatusBadge status={availabilityStatus} />}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-2 pb-4">
        <AuthSubmit pending={pending} className="mb-2">
          {cta}
        </AuthSubmit>
        <button
          type="button"
          className="text-center text-sm text-body-300 transition hover:text-green focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
          onClick={onBack}
          disabled={pending}
        >
          ← Back
        </button>
      </div>
    </form>
  );
};

export default RegisterEditUsername;
