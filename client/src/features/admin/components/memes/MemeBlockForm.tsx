import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memeBlockSchema } from '../../utils/memes';
import type { MemeBlockForm as MemeBlockValues } from '../../types';

type Props = {
  busy: boolean;
  onBlock: (id: number) => Promise<boolean>;
};

const MemeBlockForm = ({ busy, onBlock }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemeBlockValues>({
    resolver: zodResolver(memeBlockSchema),
    defaultValues: { id: '' },
  });

  return (
    <form
      onSubmit={handleSubmit(async ({ id }) => {
        if (await onBlock(Number(id))) reset();
      })}
      className="flex flex-col gap-2"
      aria-label="Block a joke id"
    >
      <label htmlFor="meme-block-id" className="text-xs font-medium text-body-300">
        Provider joke id
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="meme-block-id"
          {...register('id')}
          inputMode="numeric"
          placeholder="e.g. 153"
          aria-invalid={Boolean(errors.id)}
          className="w-40 rounded-xl border border-border/60 bg-white/[0.03] px-3 py-2 text-sm text-body outline-none placeholder:text-body-700 focus:border-green/50"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-red/20 px-4 py-2 text-sm font-medium text-red hover:bg-red/30 disabled:opacity-50"
        >
          Block
        </button>
      </div>
      {errors.id && (
        <p role="alert" className="text-xs text-red">
          {errors.id.message}
        </p>
      )}
    </form>
  );
};

export default MemeBlockForm;
