import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './styles.css';
import Image from '../Image';

const chunkArray = (array, chunkSize) => {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
};

function ImageDir({ members, className, onClick }) {
    return (
        <div
            className={`flex flex-wrap justify-center gap-2 py-2 items-center overflow-hidden rounded-md bg-transparent ${className}`}
            onClick={onClick}>
            {members.map(({ name, avatar, _id }) => (
                <Image key={_id} className="w-14 h-14 rounded-full object-fill border-2" src={avatar} alt={name} />
            ))}
        </div>
    );
}

const Carousel = ({ members, className }) => {
    const settings = {
        infinite: members.length > 6,
        dots: true,
        speed: 200,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: members.length > 6,
        arrows: false,
        dotsClass: 'slick-dots slick-thumb',
        lazyLoad: 'progressive',
    };

    const memberChunks = chunkArray(members, 6);

    return (
        <div className={className}>
            <Slider {...settings}>
                {memberChunks.map((chunk, index) => (
                    <ImageDir
                        key={index}
                        className={className}
                        members={chunk}
                        onClick={() => {
                            console.log('Member chunk clicked');
                        }}
                    />
                ))}
            </Slider>
        </div>
    );
};

export default Carousel;
