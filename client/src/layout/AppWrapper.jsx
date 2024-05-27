import Title from '@/shared/Title'
import ChatListPanel from '@/shared/chatPanel/ChatListPanel'
import ProfileHeader from '@/shared/profilePanel/ProfileHeader'
import ProfilePanel from '@/shared/profilePanel/ProfilePanel'

const sampleProfile = {
    _id: "1",
    name: 'Anish',
    avatar: [],
    userName: 'An525ish',
    bio: 'This is a Bio',
    dob: '25/12/2002'
}

const sampleNotifications = [
    {
        _id: "1",
        sender: {
            name: 'Anish',
            avatar: [],
            messaage: 'This is a message'
        }
    }
]

const AppWrapper = ({ children }) => {
    return (
        <>
            <Title />

            <main className='flex gap-4 h-[100vh] p-4'>
                <div className='flex-[1] rounded-lg hidden sm:block'><ChatListPanel /></div>
                <div className='flex-[2] bg-background-alt'>{children}</div>
                <div className='flex-[1] hidden lg:block'>
                    <ProfileHeader profile={sampleProfile} notifications={sampleNotifications} />
                    <ProfilePanel />
                </div>
            </main>
        </>
    )
}

export default AppWrapper