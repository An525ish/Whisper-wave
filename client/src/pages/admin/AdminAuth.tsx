import { AdminLoginForm as AdminLogin } from '@/features/auth';
import { AuthShell } from '@/features/auth';

export default function AdminAuth() {
  return (
    <AuthShell
      headline="Keep the room in order."
      subcopy="Signed-in ops only. Use your secret key to continue."
      modeHint="Admin"
      mode="admin"
    >
      <AdminLogin />
    </AuthShell>
  );
}
