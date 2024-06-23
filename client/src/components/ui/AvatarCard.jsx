import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import avatar from '@/assets/avatar.png'

const AvatarCard = ({ avatars, max = 3 }) => {

    return (
        <div className="relative flex items-center mx-2">
            {avatars?.slice(0, Math.min(max, avatars.length)).map((src, index) => {

                const imgSrc = !avatars || !avatars.length === 0 || !src ? avatar : src
                return (
                    <div
                        key={src}
                        className={`w-12 h-12 rounded-full overflow-hidden shadow-md border-2 border-border -ml-4`}
                        style={{ zIndex: avatars.length - index }}
                    >
                        <LazyLoadImage
                            src={imgSrc}
                            effect="blur"
                            alt="avatar-icon"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )
            }
            )}
        </div>
    );
};

export default AvatarCard;