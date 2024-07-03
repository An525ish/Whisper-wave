const AppLoader = () => {
    return (
        <div className="h-screen grid place-items-center">
            <div className="flex flex-col items-center">
                <div className="spinner w-80 h-80 rounded-full bg-gradient-to-b from-[rgb(186,66,255)] from-35% to-[rgb(0,225,255)] animate-spinning82341 animate-hue filter blur-[2px] shadow-[0px_-10px_40px_0px_rgb(186,66,255),0px_10px_40px_0px_rgb(0,225,255)] flex items-center justify-center">
                    <div className="spinner1 w-72 h-72 rounded-full bg-[rgb(36,36,36)] filter blur-[20px]"></div>
                </div>

                <div className="mt-16 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2d60ec] to-[#3ccfda] animate-loading">
                    Loading...
                </div>
            </div>
        </div>
    );
};

export default AppLoader;