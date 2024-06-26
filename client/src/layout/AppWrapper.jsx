import Title from '@/shared/Title'
import ChatListPanel from '@/shared/chatListPanel/ChatListPanel'
import ProfileHeader from '@/shared/profilePanel/ProfileHeader'
import ProfilePanel from '@/shared/profilePanel/ProfilePanel'

const AppWrapper = ({ children }) => {
    return (
        <>
            <Title />

            <main className='flex gap-4 h-[100vh] p-4'>
                <div className='flex-[1] rounded-lg hidden sm:block'><ChatListPanel /></div>
                <div className='flex-[2]'>{children}</div>
                <div className='flex-[1] hidden lg:block'>
                    <ProfileHeader />
                    <ProfilePanel />
                </div>
            </main>
        </>
    )
}

export default AppWrapper