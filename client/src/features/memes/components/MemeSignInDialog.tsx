import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import Dialog from '@/shared/components/ui/modal/Dialog';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
};

const TITLE_ID = 'meme-signin-title';

/** The one "sign in to do this" prompt — shared by the unfiltered switch and sharing. */
const MemeSignInDialog = ({ open, onClose, title, body }: Props) => (
  <Dialog open={open} onClose={onClose} labelledBy={TITLE_ID}>
    <h2 id={TITLE_ID} className="font-display text-xl text-white">
      {title}
    </h2>
    <p className="mt-1.5 text-sm leading-relaxed text-body-300">{body}</p>
    <Link
      to={ROUTES.authLogin}
      className="mt-4 block rounded-full bg-gradient-action-button-green px-5 py-2.5 text-sm font-semibold text-body transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-green"
    >
      Sign in
    </Link>
    <Link
      to={ROUTES.authRegister}
      className="mt-2 block text-center text-sm text-body-300 underline-offset-4 transition hover:text-green hover:underline focus-visible:outline-2 focus-visible:outline-green"
    >
      Create an account
    </Link>
    <button
      type="button"
      onClick={onClose}
      className="mt-2 w-full rounded-full px-5 py-2 text-sm font-medium text-body-300 transition hover:text-body focus-visible:outline-2 focus-visible:outline-green"
    >
      Not now
    </button>
  </Dialog>
);

export default MemeSignInDialog;
