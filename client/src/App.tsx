import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useProfileQuery } from '@/features/chat/hooks';
import { useAuthStore } from '@/features/auth/store';
import AppLoader from '@/shared/components/loader/AppLoader';
import { router } from '@/app/router';
import '@/App.css';

function App() {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  useProfileQuery();

  if (!bootstrapped) {
    return <AppLoader />;
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-center" />
    </>
  );
}

export default App;
