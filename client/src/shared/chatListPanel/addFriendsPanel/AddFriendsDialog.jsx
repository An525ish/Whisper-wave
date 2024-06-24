import DialogWrapper from "@/components/ui/DialogWrapper";
import Searchbar from "@/shared/Searchbar";
import { useEffect, useState } from "react";
import { useLazySearchUserQuery, useSendFriendRequestMutation } from "@/redux/reducers/apis/api";
import FriendSuggestionListItem from "./SuggestionListItem";
import useAsyncMutation from "@/hooks/asyncMutation";

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

                    {isLoading ? (
                        <p>Fetching the User...</p>
                    ) : (
                        <div className="flex flex-col gap-4 overflow-y-auto h-[58vh] scrollbar-hide">
                            {users?.map((user) =>
                                <FriendSuggestionListItem
                                    key={user._id}
                                    data={user}
                                    sentRequests={sentRequests}
                                    handleAddFriend={handleAddFriend}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DialogWrapper>
    );
}

export default AddFriendsDialog;
