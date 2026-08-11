import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useProfileQuery } from '@/features/api/hooks';
import { useAdminMeQuery } from '@/features/admin/hooks';
import { useAuthStore } from '@/stores/auth';
import { useAdminStore } from '@/stores/admin';
import AppLoader from '@/components/loader/AppLoader';
import { router } from '@/app/router';
import '@/App.css';

function App() {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const adminBootstrapped = useAdminStore((s) => s.bootstrapped);

  useProfileQuery();
  useAdminMeQuery();

  if (!bootstrapped || !adminBootstrapped) {
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
