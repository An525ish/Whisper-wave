import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import AvatarInput from '@/components/ui/AvatarInput';
import type { RegisterStep3Form } from '@/types/auth';
import { validateFullname } from '@/utils/authValidators';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

type RegisterStep3Props = {
  pending: boolean;
  onSubmit: (data: RegisterStep3Form, avatar: File | null) => Promise<void>;
  onBack: () => void;
  cta: string;
};

const RegisterStep3 = ({ pending, onSubmit, onBack, cta }: RegisterStep3Props) => {
  const [avatar, setAvatar] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterStep3Form>({
    mode: 'onChange',
  });

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data, avatar))}
      className="mt-5 flex flex-1 flex-col gap-3"
    >
      <AvatarInput file={avatar} setFile={setAvatar} />
      <AuthField
        type="text"
        name="name"
        label="Full name"
        placeholder="Your name"
        autoComplete="name"
        register={register}
        validate={validateFullname}
        errors={errors}
      />

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

export default RegisterStep3;
