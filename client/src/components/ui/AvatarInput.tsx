import { AVATAR_FALLBACK } from '@/constants/app';
import { useState, type ChangeEvent } from 'react';

type AvatarInputProps = {
  file?: File | null;
  setFile: (file: File | null) => void;
};

const AvatarInput = ({ setFile }: AvatarInputProps) => {
  const [preview, setPreview] = useState<string>(AVATAR_FALLBACK);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (!next) return;
    setFile(next);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(next);
  };

  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <label
        htmlFor="auth-avatar"
        className="group relative inline-flex h-[3.25rem] w-[3.25rem] shrink-0 cursor-pointer overflow-hidden rounded-full ring-2 ring-green/30 transition hover:ring-green/60 focus-within:ring-2 focus-within:ring-green/50"
      >
        <img src={preview} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[9px] font-semibold uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">
          Edit
        </span>
        <input
          id="auth-avatar"
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="sr-only"
        />
      </label>
      <div className="min-w-0 text-left">
        <p className="text-sm font-medium text-white">Profile photo</p>
        <p className="text-xs text-body-300">Optional — tap to upload</p>
      </div>
    </div>
  );
};

export default AvatarInput;
