import { RouterProvider } from 'react-router-dom';
import { useAuthStore, useProfileQuery } from '@/features/auth';
import AppLoader from '@/shared/components/ui/loader/AppLoader';
import AppToaster from '@/shared/components/ui/AppToaster';
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
      <AppToaster />
    </>
  );
}

export default App;
