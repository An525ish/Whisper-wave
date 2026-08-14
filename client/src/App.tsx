import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useProfileQuery } from '@/hooks/chat';
import { useAuthStore } from '@/stores/auth';
import AppLoader from '@/components/ui/loader/AppLoader';
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
