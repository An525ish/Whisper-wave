import ChatsLayout from '@/layout/ChatsLayout';
import { useAuthStore } from '@/features/auth';
import { GuestChatsEmpty } from '@/features/chat';

/**
 * Messages empty state — shown at `/chats` until a conversation opens.
 * Guests get the Whisper-pointing empty state instead of the messages app.
 */
const Chats = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <GuestChatsEmpty />;
  return (
    <ChatsLayout>
      <div className="grid h-full w-full place-items-center px-6">
        <div className="max-w-md text-center">
          <img
            src="/logo-2.jpeg"
            alt="Whisper Wave"
            className="mx-auto h-auto w-full max-w-52 rounded-full mix-blend-overlay brightness-125 shadow-xl md:max-w-xs lg:max-w-md"
          />
          <p className="mt-6 text-2xl font-semibold capitalize text-body-300 md:text-3xl">
            Welcome to Whisper Wave
          </p>
          <p className="mt-2 text-base text-body-300/90 md:text-lg">
            Pick a chat — let's have some fun 👀
          </p>
        </div>
      </div>
    </ChatsLayout>
  );
};

export default Chats;
