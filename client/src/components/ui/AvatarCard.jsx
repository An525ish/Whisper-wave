const AvatarCard = ({ avatars, max = 3 }) => {
    return (
        <div className="relative flex items-center mx-2">
            {avatars.slice(0, Math.min(max, avatars.length)).map((src, index) => (
                <div
                    key={src}
                    className={`w-12 h-12 rounded-full overflow-hidden shadow-md border-2 border-border -ml-4`}
                    style={{ zIndex: avatars.length - index }}
                >
                    <img src={src} alt="avatar-icon" className="w-full h-full object-cover" />
                </div>
            ))}
        </div>
    );
};

export default AvatarCard;