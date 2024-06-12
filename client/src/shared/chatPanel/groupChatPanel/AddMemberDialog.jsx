import { useRef, useState } from 'react';
import DialogWrapper from "@/components/ui/DialogWrapper";
import SuggestionListItem from "./SuggestionListItem";
import Searchbar from "@/shared/Searchbar";
import { chats as users } from "@/lib/samples";
import AddMemberIcon from "@/components/icons/AddMember";
import AvatarCard from "@/components/ui/AvatarCard";
import useContextMenu from '@/hooks/Context-menu';
import ContextMenu from '@/components/context-menu/ContextMenu';


const AddMemberDialog = ({ isMemberDialog, setIsMemberDialog }) => {
    const [searchText, setSearchText] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isAddMember, setIsAddMember] = useState(false);
    const dialogRef = useRef()
    const { menuState, showContextMenu, hideContextMenu } = useContextMenu();

    const handleSelectMember = (id) => {
        console.log(id);
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(el => el !== id) : [...prev, id]);
    };

    const onSubmit = async (data) => {
        try {
            console.log(data);
            setIsMemberDialog(false);
        } catch (error) {
            console.error('Error registering user:', error);
        }
    };

    const addMemberHandler = () => {
        setIsAddMember(true);
    };

    const handleContextMenu = (e, memberId) => {
        e.preventDefault();
        const options = [
            {
                id: 1,
                icon: '/icons/chat-icon.svg',
                name: 'Open Conversation'
            },
            {
                id: 2,
                icon: '/icons/remove-user-icon.svg',
                name: 'Remove Member'
            }
        ];
        const boundingRect = dialogRef.current.getBoundingClientRect();
        showContextMenu({ x: e.clientX - boundingRect.left, y: e.clientY - boundingRect.top }, options, (option) => {
            console.log(`Selected option: ${option} for member: ${memberId}`);
        });
    };

    return (
        <DialogWrapper isOpen={isMemberDialog}>
            <div ref={dialogRef} className="py-4 px-6">
                <div className="flex justify-between items-center">
                    <p className="font-medium text-xl">
                        <span onClick={() => setIsMemberDialog(false)} className="mr-4 inline-block rotate-180 hover:text-red transition cursor-pointer">↪</span>
                        {isAddMember ? 'Add Members' : `Members (5)`}
                    </p>
                    {isAddMember && <button className="border border-green-light rounded-2xl px-4 py-0.5 text-green hover:scale-95 transition" onClick={onSubmit}>Add</button>}
                </div>

                <div className='py-2 my-4 flex justify-between items-center border full-border'>
                    <span className="text-body-700">Search For Members :</span>
                    <Searchbar width="w-[20rem]" searchText={searchText} setSearchText={setSearchText} />
                </div>

                {!isAddMember && (
                    <button
                        className="hover:text-green text-body-700 flex gap-2 items-center group transition"
                        onClick={addMemberHandler}
                    >
                        <div className="p-2 border border-border group-hover:border-green-light transition rounded-full">
                            <AddMemberIcon className={'w-7 h-7 transition group-hover:fill-green'} />
                        </div>
                        Add Members
                    </button>
                )}

                {isAddMember ? (
                    <div>
                        <p className="text-body-300 font-medium my-4">Suggested</p>
                        <div className="flex flex-col gap-4 overflow-y-auto h-[58vh] scrollbar-hide">
                            {users.map((member) =>
                                <SuggestionListItem
                                    key={member._id}
                                    data={member}
                                    isSelected={selectedMembers.includes(member._id)}
                                    handleSelectMember={handleSelectMember}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-body-300 font-medium my-6 px-2">Existing Members</p>
                        <div className="flex flex-col overflow-y-auto h-[50vh] scrollbar-hide">
                            {users.map((member) =>
                                <div
                                    key={member._id}
                                    className={`flex gap-2 items-center px-4 cursor-pointer rounded-lg group relative hover:bg-gradient-line-fade-light transition py-2`}
                                    onContextMenu={(e) => handleContextMenu(e, member._id)}
                                >
                                    <AvatarCard avatars={member.avatar} />
                                    <div className="flex-[1] text-body-700">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium capitalize">{member.name}</p>
                                            <p className='text-body-300'>Admin</p>
                                        </div>
                                    </div>

                                </div>
                            )}
                            <ContextMenu menuState={menuState} hideContextMenu={hideContextMenu} />
                        </div>
                    </div>
                )}
            </div>
        </DialogWrapper>
    );
};

export default AddMemberDialog;
