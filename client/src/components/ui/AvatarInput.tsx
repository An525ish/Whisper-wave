import { useState, type ChangeEvent } from 'react';
import avatarImg from '@/assets/avatar.png';

type AvatarInputProps = {
  file?: File | null;
  setFile: (file: File | null) => void;
};

const AvatarInput = ({ setFile }: AvatarInputProps) => {
  const [preview, setPreview] = useState<string>(avatarImg);

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
    <div className="flex justify-center">
      <label htmlFor="avatar" className="relative">
        <figure className="relative w-28 h-28">
          <img
            src={preview}
            alt="avatar"
            className="w-28 h-28 object-cover rounded-full border-2 border-blue shadow-lg cursor-pointer transition-all duration-300 hover:shadow-md"
          />
          <figcaption className="absolute top-0 left-0 w-full h-full rounded-full bg-black/0 flex items-center justify-center opacity-0 transition-all duration-300 hover:opacity-100 hover:bg-black/50 cursor-pointer">
            <img
              src="https://raw.githubusercontent.com/ThiagoLuizNunes/angular-boilerplate/master/src/assets/imgs/camera-white.png"
              className="w-12 h-12"
              alt=""
            />
          </figcaption>
          <span className="absolute bottom-3 right-0 w-6 h-6 flex justify-center items-center bg-primary rounded-full cursor-pointer">
            📷
          </span>
        </figure>
      </label>
      <input
        type="file"
        onChange={handleChange}
        id="avatar"
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default AvatarInput;
