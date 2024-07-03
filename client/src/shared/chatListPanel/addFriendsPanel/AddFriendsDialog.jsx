import DialogWrapper from "@/components/ui/DialogWrapper";
import Searchbar from "@/shared/Searchbar";
import { useEffect, useState } from "react";
import { useLazySearchUserQuery, useSendFriendRequestMutation } from "@/redux/reducers/apis/api";
import FriendSuggestionListItem from "./SuggestionListItem";
import useAsyncMutation from "@/hooks/asyncMutation";
import AvatarSkeleton from "@/components/skeletons/AvatarSkeleton";

const AddFriendsDialog = ({ isOpen, setIsClicked }) => {
    const [searchText, setSearchText] = useState('');
    const [users, setUsers] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [sendFriendRequest] = useAsyncMutation(useSendFriendRequestMutation);

    const [searchUser, { isLoading }] = useLazySearchUserQuery();

    const handleAddFriend = async (receiverId) => {
        try {
            await sendFriendRequest('Sending Friend Request', { receiverId });
            setSentRequests((prev) => [...prev, receiverId]);
        } catch (error) {
            console.error('Error adding friend:', error);
        }
    };

    useEffect(() => {
        let timeoutId;

        if (searchText.trim() !== '') {
            timeoutId = setTimeout(async () => {
                try {
                    const { data: allUsers } = await searchUser({ name: searchText });
                    setUsers(allUsers?.data || []);
                } catch (error) {
                    console.error(error);
                    setUsers([]);
                }
            }, 1000);
        } else {
            setUsers([]);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [searchText, searchUser]);

    return (
        <DialogWrapper isOpen={isOpen}>
            <div className="p-4">
                <div className="flex justify-between">
                    <span
                        onClick={() => setIsClicked(false)}
                        className="font-medium text-xl mr-4 inline-block rotate-180 hover:text-red cursor-pointer">
                        ↪
                    </span>
                    <p className="font-medium text-xl"> Add New Friends</p>
                    <span className="w-6"></span>
                </div>

                <div className='mt-6 py-2 flex justify-between items-center border full-border'>
                    <span className="text-body-700">Search For Members:</span>
                    <Searchbar searchText={searchText} setSearchText={setSearchText} autoFocus={true} />
                </div>

                <div>
                    <p className="text-body-300 font-medium my-4">Suggested</p>

                    <div className="flex flex-col gap-4 overflow-y-auto h-[58vh] scrollbar-hide">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => <AvatarSkeleton
                                key={i} className={'px-4 py-2 h-20 bg-transparent'} />)
                        ) : (
                            users.length === 0 ?
                                <div className="grid place-items-center h-full">
                                    <div className="mb-12 text-center">
                                        <img src="/images/no-member.svg" alt="no member" className="w-60 opacity-50" />
                                        <p className="text-xl mt-6 font-semibold text-body-300">No Member found</p>
                                    </div>
                                </div>
                                :
                                users.map((user) =>
                                    <FriendSuggestionListItem
                                        key={user._id}
                                        data={user}
                                        sentRequests={sentRequests}
                                        handleAddFriend={handleAddFriend}
                                    />
                                )
                        )}
                    </div>

                </div>
            </div>
        </DialogWrapper>
    );
}

export default AddFriendsDialog;
