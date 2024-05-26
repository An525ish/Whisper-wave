import Title from '@/shared/Title'
import ChatListPanel from '@/shared/ChatListPanel'

const AppWrapper = ({ children }) => {
    return (
        <>
            <Title />

            <main className='flex gap-4 h-[100vh] p-4'>
                <div className='flex-[1] rounded-lg hidden sm:block'><ChatListPanel /></div>
                <div className='flex-[2] bg-background-alt'>{children}</div>
                <div className='flex-[1] bg-border hidden lg:block'>Profile</div>
            </main>
        </>
    )
}

export default AppWrapper