import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useProfileQuery } from '@/features/api/hooks';
import { useAuthStore } from '@/stores/auth';
import AppLoader from '@/components/loader/AppLoader';
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
