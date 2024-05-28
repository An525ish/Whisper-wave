import ChatBox from "./ChatBox"

const ChatsViewPanel = ({ chats, user }) => {
    return (
        <div className="bg-glass-background bg-center -mt-4">
            <div className='h-[85vh] borde border-border rounded-lg p-2 flex flex-col overflow-y-auto scrollbar-hide backdrop-blur-lg backdrop-saturate-[100%] bg-[rgba(33,26,42,0.75)]'>
                {chats.map((chat) => <ChatBox key={chat._id} data={chat} user={user} />)}
            </div>
        </div>
    )
}

export default ChatsViewPanel