import AppWrapper from '@/layout/AppWrapper';

const Home = () => {
  return (
    <AppWrapper>
      <div className="grid h-full w-full place-items-center px-6">
        <div className="max-w-md text-center">
          <img
            src="/logo-2.jpeg"
            alt="Whisper Wave"
            className="mx-auto h-auto w-full max-w-52 rounded-full mix-blend-overlay brightness-125 shadow-xl md:max-w-xs lg:max-w-md"
          />
          <p className="mt-6 font-display text-2xl font-semibold capitalize text-body-300 md:text-3xl">
            Welcome to Whisper Wave
          </p>
          <p className="mt-2 font-display text-base text-body-300/90 md:text-lg">
            Pick a chat from the list to get started
          </p>
        </div>
      </div>
    </AppWrapper>
  );
};

export default Home;
