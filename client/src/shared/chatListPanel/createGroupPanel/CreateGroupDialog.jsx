import DialogWrapper from "@/components/ui/DialogWrapper";
import useAsyncMutation from "@/hooks/asyncMutation";
import { useCreateGroupMutation, useMyFriendsQuery } from "@/redux/reducers/apis/api";
import Searchbar from "@/shared/Searchbar";
import { useState } from "react";
import toast from "react-hot-toast";
import GroupChatItem from "./SuggestionListItem";
import { useNavigate } from "react-router-dom";
import AvatarSkeleton from "@/components/skeletons/AvatarSkeleton";

const GroupChatDialog = ({ isCreateGroup, setIsCreateGroup }) => {
    const [searchText, setSearchText] = useState('');
    const [groupname, setGroupName] = useState('');

    const navigate = useNavigate()

    const { data: friends, isLoading, error } = useMyFriendsQuery({})
    const [createGroup, { isLoading: isCreateGroupLoading }] = useAsyncMutation(useCreateGroupMutation)

    const [selectedMembers, setSelectedMembers] = useState([])

    const handleSelectMember = (id) => {
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(el => el !== id) : [...prev, id])
    }

    const onSubmit = async () => {
        if (!groupname) return toast.error('Please add a group name')
        if (selectedMembers.length < 2) return toast.error('Select atleast 2 members')
        const data = await createGroup('Creating your group...', { name: groupname, members: selectedMembers })
        setIsCreateGroup(false)
        navigate(`/chat/${data?._id}`)
    };

    if (error) return <div>Error: {error.message}</div>

    const friendsData = friends?.data || []
    const filteredMembers = friendsData.filter((friend) => friend.name.toLowerCase().includes(searchText.toLowerCase()))


    return (
        <DialogWrapper isOpen={isCreateGroup}>
            <div className="p-4">
                <div className="flex justify-between items-center">
                    <p className="font-medium text-xl"> <span onClick={() => setIsCreateGroup(false)} className="mr-4 inline-block rotate-180 cursor-pointer">↪</span>New Group</p>
                    <button
                        className="border border-green-light rounded-2xl px-4 py-0.5 text-green hover:scale-95 transition"
                        onClick={onSubmit}
                        disabled={isCreateGroupLoading}
                    >
                        Create
                    </button>
                </div>

                <div className="mt-3">
                    <input
                        className={'px-4 py-2 border-border rounded-3xl bg-primary w-full outline-none bg-transparent border-0 border-b full-border text-center text-lg'}
                        type="text"
                        autoFocus={true}
                        placeholder='Type your Group Name...'
                        value={groupname}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                </div>

                <div className='py-2 flex justify-between items-center border full-border'>
                    <span className="text-body-700">Search For Members :</span>
                    <Searchbar searchText={searchText} setSearchText={setSearchText} />
                </div>

                <div>
                    <p className="text-body-300 font-medium my-4">Suggested</p>

                    <div className="flex flex-col gap-4 overflow-y-auto h-[58vh] scrollbar-hide">
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) =>
                                <AvatarSkeleton key={i} className={'px-4 py-2 h-20 bg-transparent'} />)
                        ) : (
                            filteredMembers.length === 0 ? (
                                <div className="grid place-items-center h-full">
                                    <div className="mb-12 text-center">
                                        <img src="/images/no-member.svg" alt="no member" className="w-60 opacity-50" />
                                        <p className="text-xl mt-6 font-semibold text-body-300">No Member found</p>
                                    </div>
                                </div>
                            ) : (
                                filteredMembers.map((friend) => (
                                    <GroupChatItem
                                        key={friend._id}
                                        data={friend}
                                        isSelected={selectedMembers.includes(friend._id)}
                                        handleSelectMember={handleSelectMember}
                                    />
                                ))
                            )
                        )}
                    </div>

                </div>

            </div>
        </DialogWrapper>
    )
}

export default GroupChatDialog