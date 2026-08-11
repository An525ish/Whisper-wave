import { Helmet } from "react-helmet-async"

type TitleProps = {
    title?: string;
    desc?: string;
};

const Title = ({
    title = 'Whisper Wave',
    desc = 'This is a real time chat app'
}: TitleProps) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="decription" content={desc} />
        </Helmet>
    )
}

export default Title
