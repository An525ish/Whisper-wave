import { AVATAR_FALLBACK } from '@/constants/app';
import { useState, type ChangeEvent } from 'react';

type AvatarInputProps = {
  file?: File | null;
  setFile: (file: File | null) => void;
};

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" aria-hidden>
    <path
      d="M4 8.5h2.2l1.1-1.8h5.4L14 8.5H16.5A1.5 1.5 0 0 1 18 10v7.5A1.5 1.5 0 0 1 16.5 19h-9A1.5 1.5 0 0 1 6 17.5V10a1.5 1.5 0 0 1 1.5-1.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

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
    <div className="auth-avatar-upload">
      <label htmlFor="auth-avatar" className="auth-avatar-upload__trigger">
        <span className="auth-avatar-upload__ring" aria-hidden />
        <img src={preview} alt="" className="auth-avatar-upload__image" />
        <span className="auth-avatar-upload__overlay">
          <CameraIcon />
          <span className="auth-avatar-upload__overlay-label">Upload photo</span>
        </span>
        <input
          id="auth-avatar"
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="sr-only"
        />
      </label>
      <p className="auth-avatar-upload__hint">Add a face to your quiet corner</p>
    </div>
  );
};

export default AvatarInput;
