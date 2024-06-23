import LeaveGroupIcon from "@/components/icons/LeaveGroup";
import PhoneCallIcon from "@/components/icons/PhoneCall";
import ThreeDotsIcon from "@/components/icons/ThreeDots";
import VideoCallIcon from "@/components/icons/VideoCall";
import AvatarCard from "@/components/ui/AvatarCard";
import ConfirmationModal from "@/components/ui/modal/confirmation-modal/ConfirmationModal";
import { useEffect, useRef, useState } from "react";
import AddMemberDialog from "./groupChatPanel/AddMemberDialog";
import MembersIcon from "@/components/icons/Members";
import { useParams } from "react-router-dom";
import { useChatDetailsQuery } from "@/redux/reducers/apis/api";

const ChatHeader = () => {
    const [isDotsMenu, setIsDotsMenu] = useState(false);
    const [isConfirmLeave, setIsConfirmLeave] = useState(false);
    const [isMemberDialog, setIsMemberDialog] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    const { chatId } = useParams();
    const { data: chatDetails, isLoading } = useChatDetailsQuery({ id: chatId, populate: true });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsDotsMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (isLoading) return <>Loading...</>;

    const chatData = chatDetails?.data || {};
    const { avatar, name, members, groupChat } = chatData;

    const handleToggle = () => {
        setIsDotsMenu((prev) => !prev);
    };

    const handleisConfirmLeave = () => {
        setIsDotsMenu(false);
        setIsConfirmLeave(true);
    };

    const addMemberHandler = () => {
        setIsDotsMenu(false);
        setIsMemberDialog(true);
    };

    return (
        <>
            {isConfirmLeave && <ConfirmationModal onClose={() => setIsConfirmLeave(false)} />}

            <div className="absolute -top-2 w-[90%] left-1/2 -translate-x-1/2 shadow-2xl z-30">
                <div className="py-2 px-6 rounded-xl border border-border backdrop-blur-lg backdrop-saturate-[110%] bg-[rgba(33,26,42,0.75)]">
                    <div className="relative flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                            <AvatarCard avatars={[avatar]} />
                            <div>
                                <p className="font-medium">{name}</p>
                                <p className="text-sm text-body-700">Online</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button disabled className="w-10 h-10 rounded-full grid place-items-center border border-border group hover:border-green-light">
                                <PhoneCallIcon className="w-5 h-5 transition group-hover:fill-green" />
                            </button>
                            <button disabled className="w-10 h-10 rounded-full grid place-items-center border border-border group hover:border-green-light">
                                <VideoCallIcon className="w-5 h-5 transition group-hover:fill-green" />
                            </button>
                            <button ref={buttonRef} onClick={handleToggle} className="w-10 h-10 rounded-full grid place-items-center border border-border group hover:border-green-light">
                                <ThreeDotsIcon className="w-4 h-4 transition group-hover:fill-green" />
                            </button>
                        </div>

                        {isDotsMenu && (
                            <div ref={menuRef} className="border border-border bg-background-alt rounded-lg p-4 absolute right-9 top-16 flex flex-col items-start gap-2">
                                {groupChat ? (
                                    <>
                                        <button
                                            className="hover:text-green text-body-300 group transition"
                                            onClick={addMemberHandler}
                                        >
                                            <MembersIcon className="w-5 h-5 transition group-hover:fill-green inline-block mr-1" /> Members
                                        </button>
                                        <button
                                            className="hover:text-green text-body-300 group transition"
                                            onClick={handleisConfirmLeave}
                                        >
                                            <LeaveGroupIcon className="w-4 h-4 transition group-hover:fill-green inline-block mr-2" /> Leave Group
                                        </button>
                                    </>
                                ) : (
                                    // Personal chat menu option buttons go here
                                    <></>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isMemberDialog && (
                <div className="relative top-[4.3rem]">
                    <AddMemberDialog
                        isMemberDialog={isMemberDialog}
                        members={members}
                        setIsMemberDialog={setIsMemberDialog}
                    />
                </div>
            )}
        </>
    );
};

export default ChatHeader;
