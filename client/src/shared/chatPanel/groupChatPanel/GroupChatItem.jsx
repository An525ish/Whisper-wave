import AvatarCard from "@/components/ui/AvatarCard"

const GroupChatItem = ({ data, isSelected, handleSelectMember }) => {
    const { avatar, name, _id } = data
    return (
        < div
            className={`flex gap-2 items-center px-4 cursor-pointer rounded-lg group`}
            onClick={() => handleSelectMember(_id)}
        >
            <AvatarCard avatars={avatar} />

            <div className="flex-[1]">
                <div className="flex justify-between items-center">
                    <p className="font-medium capitalize text-body-700">{name}</p>
                    <button className={`w-6 h-6 rounded-full border-2 border-border group-hover:border-green ${isSelected ? 'text-green border-green ' : 'text-transparent'}`}>✔</button>
                </div>
            </div>
        </div>
    )
}

export default GroupChatItem