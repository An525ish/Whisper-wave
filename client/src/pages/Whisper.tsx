import { Helmet } from 'react-helmet-async';
import {
  VibePicker,
  WaitingRoom,
  AnonChatRoom,
  useWhisperFlow,
} from '@/features/whisper';

/** Document title + social meta for the public entry point. */
const WHISPER_META = (
  <>
    <title>Find a Stranger · Whisper Wave</title>
    <meta
      name="description"
      content="Whisper with one anonymous stranger. No account, no profile — just a vibe. If it clicks, you can open a real DM."
    />
    <meta property="og:title" content="Find a Stranger · Whisper Wave" />
    <meta
      property="og:description"
      content="No account. No profile. Just a vibe. If it clicks, you keep them."
    />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
  </>
);

/**
 * Whisper route entry.
 *
 * Composition only — the flow (store selection, socket, mutations, analytics)
 * lives in `useWhisperFlow`.
 */
export default function Whisper() {
  const { status, picker, waiting, chat } = useWhisperFlow();

  if (status === 'idle' || status === 'joining') {
    return (
      <>
        <Helmet>{WHISPER_META}</Helmet>
        <VibePicker {...picker} />
      </>
    );
  }

  if (status === 'waiting') {
    return <WaitingRoom {...waiting} />;
  }

  if (status === 'matched' || status === 'connected') {
    return <AnonChatRoom {...chat} />;
  }

  return null;
}
