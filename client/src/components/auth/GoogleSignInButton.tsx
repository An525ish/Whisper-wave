import { useGoogleLogin } from '@react-oauth/google';
import GoogleIcon from '@/components/ui/icons/Google';
import { useGoogleSignInMutation } from '@/hooks/auth';
import { toErrorMessage } from '@/utils/helpers';
import toast from 'react-hot-toast';

type GoogleSignInButtonProps = {
  disabled?: boolean;
};

/**
 * Themed Google CTA — matches auth panel fields / secondary actions.
 * Uses GIS popup access-token flow; server verifies token via /tokeninfo
 * (checks aud = our client ID) then fetches profile from /userinfo.
 * Hidden when VITE_GOOGLE_CLIENT_ID is unset (no OAuth provider mounted).
 */
const GoogleSignInButtonInner = ({ disabled }: GoogleSignInButtonProps) => {
  const googleSignIn = useGoogleSignInMutation();
  const busy = disabled || googleSignIn.isPending;

  const openGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!tokenResponse.access_token) {
        toast.error('Google sign-in failed — no token returned.');
        return;
      }
      try {
        await googleSignIn.mutateAsync({
          accessToken: tokenResponse.access_token,
        });
      } catch (error) {
        toast.error(toErrorMessage(error, 'Google sign-in failed.'));
      }
    },
    onError: () => {
      toast.error('Google sign-in was cancelled or failed. Try again.');
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center gap-3" aria-hidden>
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] uppercase tracking-widest text-body-300/70">
          or
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        className="auth-google-btn"
        disabled={busy}
        onClick={() => openGoogle()}
      >
        {googleSignIn.isPending ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden
          />
        ) : (
          <>
            <GoogleIcon className="auth-google-btn__mark" />
            <span>Continue with Google</span>
          </>
        )}
      </button>
    </div>
  );
};

const GoogleSignInButton = (props: GoogleSignInButtonProps) => {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;
  return <GoogleSignInButtonInner {...props} />;
};

export default GoogleSignInButton;
