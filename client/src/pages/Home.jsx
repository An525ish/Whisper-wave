import AppWrapper from "@/layout/AppWrapper"

const Home = () => {
    return (
        <AppWrapper>
            <div className="grid place-items-center h-full w-full">
                <div className="text-center">
                    <img src="/logo-2.jpeg" alt="icon" className="w-[30rem] h-[30rem] rounded-full mix-blend-overlay brightness-125 shadow-xl" />
                    <p className="capitalize font-[cursive] mt-6 text-3xl font-semibold text-body-300">welcome to whisper wave</p>
                    <p className="text-xl font-[cursive] font-semibold text-body-300 mt-2">Let's have some fun 👀</p>
                </div>
            </div>
        </AppWrapper>
    )
}

export default Home