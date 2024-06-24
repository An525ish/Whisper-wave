import AvatarCard from "@/components/ui/AvatarCard";
import { useState } from "react";

const FriendSuggestionListItem = ({ data, handleAddFriend }) => {
    const { avatar, name, _id, isRequested } = data;
    const [isSent, setIsSent] = useState(isRequested);

    const handleClick = (id) => {
        setIsSent(true);
        handleAddFriend(id);
    };

    return (
        <div className={`flex gap-2 items-center px-4 rounded-lg group`}>
            <AvatarCard avatars={[avatar]} />
            <div className="flex-[1]">
                <div className="flex justify-between items-center">
                    <p className="font-medium capitalize text-body-700">{name}</p>
                    <button
                        className={`rounded-2xl px-4 py-0.5 hover:scale-95 transition ${isSent ? 'bg-gradient-green text-white-pure' : 'border border-green-light text-green'}`}
                        onClick={() => handleClick(_id)}
                        disabled={isSent}
                    >
                        {isSent ? 'Sent' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FriendSuggestionListItem;
