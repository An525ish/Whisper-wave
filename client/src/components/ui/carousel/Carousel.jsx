import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './styles.css';

function ImageDir({ imgDir, className, altText, onClick }) {
    return (
        <div
            className={`flex flex-wrap gap-2 py-2 items-center overflow-hidden rounded-md bg-transparent ${className}`}
            onClick={onClick}>
            {Array(6).fill(0).map((src, index) => <img key={src} className="w-14 h-14 rounded-full object-fill border-2" src={"https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250"} alt={index} />)}
        </div>
    );
}

const Carousel = ({ className }) => {

    const settings = {
        infinite: true,
        dots: true,
        speed: 200,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        arrows: false,
        dotsClass: 'slick-dots slick-thumb',
        lazyLoad: 'progressive',
    };

    return (
        <>
            <div className={className}>
                <Slider {...settings}>
                    {Array(4).fill(0).map((banner, index) => (
                        <ImageDir
                            key={index}
                            className={className}
                            imgDir={banner.imageUrl}
                            altText={banner.bannerName}
                            onClick={() => {
                                console.log('first')
                            }}
                        />
                    ))}
                </Slider>
            </div>
        </>
    );
};

export default Carousel;