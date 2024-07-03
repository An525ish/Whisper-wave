
const AvatarSkeleton = ({ className }) => {
    return (
        <div className={`w-full flex items-center rounded-md gap-4 bg-primary ${className}`}>
            <div>
                <div className="bg-background-alt w-14 h-14 rounded-full"></div>
            </div>

            <div className="w-full">
                <div className="h-6 w-2/3 bg-background-alt animate-pulse"></div>
                <div className="h-4 w-1/3 mt-2 bg-background-alt animate-pulse"></div>
            </div>
        </div>
    )
}

export default AvatarSkeleton