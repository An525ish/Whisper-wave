import AppWrapper from "@/layout/AppWrapper"

const Home = () => {
    return (
        <AppWrapper>
            <div className="grid h-full w-full place-items-center px-4">
                <div className="text-center max-w-md">
                    <img
                        src="/logo-2.jpeg"
                        alt="Whisper Wave"
                        className="mx-auto h-auto w-full max-w-xs rounded-full mix-blend-overlay brightness-125 shadow-xl md:max-w-md"
                    />
                    <p className="mt-6 font-display text-3xl font-semibold capitalize text-body-300">
                        Welcome to Whisper Wave
                    </p>
                    <p className="mt-2 font-display text-lg text-body-300">
                        Pick a chat to get started
                    </p>
                </div>
            </div>
        </AppWrapper>
    )
}

export default Home
