import { RouterProvider } from 'react-router-dom';
import { useProfileQuery } from '@/hooks/chat';
import { useAuthStore } from '@/stores/auth';
import AppLoader from '@/components/ui/loader/AppLoader';
import AppToaster from '@/components/ui/AppToaster';
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
