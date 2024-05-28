import DialogWrapper from "@/components/ui/DialogWrapper"
import InputField from "@/components/ui/InputField";
import { useForm } from "react-hook-form";
import GroupChatItem from "./GroupChatItem";
import Searchbar from "@/shared/Searchbar";
import { useState } from "react";
import { chats as users } from "@/lib/samples";

const GroupChatDialog = ({ isCreateGroup, setIsCreateGroup }) => {
    const [searchText, setSearchText] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({ mode: 'onChange' });

    const [selectedMembers, setSelectedMembers] = useState([])

    const handleSelectMember = (id) => {
        console.log(id)
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
                        placeholder='Group Name'
                        register={register}
                        errors={errors}
                    />
                </div>

                <div className='cursor-pointer py-2 flex justify-between items-center border full-border'>
                    <span className="text-body-700">Search For Members :</span>
                    <Searchbar searchText={searchText} setSearchText={setSearchText} />
                </div>

                <div>
                    <p className="text-body-300 font-medium my-4">Suggested</p>

                    <div className="flex flex-col gap-4 overflow-y-auto h-[58vh] scrollbar-hide">
                        {users.map((member) =>
                            <GroupChatItem
                                key={member._id}
                                data={member}
                                isSelected={selectedMembers.includes(member._id)}
                                handleSelectMember={handleSelectMember}
                            />
                        )}
                    </div>
                </div>

            </div>
        </DialogWrapper>
    )
}

export default GroupChatDialog