import { Helmet } from "react-helmet-async"

const Title = ({
    title = 'Whisper Wave',
    desc = 'This is a real time chat app'
}) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="decription" content={desc} />
        </Helmet>
    )
}

export default Title