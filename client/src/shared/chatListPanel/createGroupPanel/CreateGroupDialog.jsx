import DialogWrapper from "@/components/ui/DialogWrapper"
import InputField from "@/components/ui/InputField";
import { useForm } from "react-hook-form";
import GroupChatItem from "./SuggestionListItem";
import Searchbar from "@/shared/Searchbar";
import { useState } from "react";
import { useMyFriendsQuery } from "@/redux/reducers/apis/api";

const GroupChatDialog = ({ isCreateGroup, setIsCreateGroup }) => {
    const [searchText, setSearchText] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const { data: friends, isLoading, error } = useMyFriendsQuery({})

    const [selectedMembers, setSelectedMembers] = useState([])

    const handleSelectMember = (id) => {
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(el => el !== id) : [...prev, id])
    }

    const onSubmit = async (data) => {
        try {
            console.log(data)
            //   const response = await axios.post('https://your-api-endpoint.com/register', data);
            //   console.log('Registration successful:', response.data);
        } catch (error) {
            console.error('Error registering user:', error);
            // Handle error (e.g., show error message to the user)
        }
    };

    if (error) return <div>Error: {error.message}</div>

    const friendsData = friends?.data || []
    const filteredMembers = friendsData.filter((friend) => friend.name.toLowerCase().includes(searchText.toLowerCase()))


    return (
        <DialogWrapper isOpen={isCreateGroup}>
            <div className="p-4">
                <div className="flex justify-between items-center">
                    <p className="font-medium text-xl"> <span onClick={() => setIsCreateGroup(false)} className="mr-4 inline-block rotate-180 cursor-pointer">↪</span>New Group</p>
                    <button className="border border-green-light rounded-2xl px-4 py-0.5 text-green hover:scale-95 transition" onClick={handleSubmit(onSubmit)}>Create</button>
                </div>

                <div className="mt-3">
                    <InputField
                        className={'bg-transparent border-0 border-b full-border text-center text-lg'}
                        type="text"
                        name='groupname'
                        autoFocus={true}
                        placeholder='Type your Group Name...'
                        register={register}
                        errors={errors}
                    />
                </div>

                <div className='py-2 flex justify-between items-center border full-border'>
                    <span className="text-body-700">Search For Members :</span>
                    <Searchbar searchText={searchText} setSearchText={setSearchText} />
                </div>

                <div>
                    <p className="text-body-300 font-medium my-4">Suggested</p>

                    {isLoading ? <p>Fetching Your Friends...</p> :
                        <div className="flex flex-col gap-4 overflow-y-auto h-[58vh] scrollbar-hide">
                            {filteredMembers.map((friend) =>
                                <GroupChatItem
                                    key={friend._id}
                                    data={friend}
                                    isSelected={selectedMembers.includes(friend._id)}
                                    handleSelectMember={handleSelectMember}
                                />
                            )}
                        </div>}
                </div>

            </div>
        </DialogWrapper>
    )
}

export default GroupChatDialog