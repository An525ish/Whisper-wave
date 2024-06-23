import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import avatar from '@/assets/avatar.png';

const Image = ({ src, alt, effect = "blur", className, ...props }) => {
    const imgSrc = !src ? avatar : src;
    return (
        <LazyLoadImage
            {...props}
            src={imgSrc}
            effect={effect}
            alt={alt}
            className={`object-cover ${className}`}
        />
    );
};

export default Image;
