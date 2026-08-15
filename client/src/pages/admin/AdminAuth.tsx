import AdminLogin from '@/components/auth/AdminLoginForm';
import AuthShell from '@/components/auth/AuthShell';

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
