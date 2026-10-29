import { LegalPage, LEGAL_UPDATED } from '@/features/landing';

const Guidelines = () => (
  <LegalPage
    title="Community Guidelines"
    updated={LEGAL_UPDATED}
    intro="Whisper Wave works when people feel safe talking to strangers. These guidelines are plain-language expectations, not legal advice."
  >
    <section>
      <h2>Adults only</h2>
      <p>You must be 18 or older. If you believe someone is under 18, report them.</p>
    </section>

    <section>
      <h2>Be kind</h2>
      <p>Treat people the way you would want to be treated. Disagree without attacking. Leave if a chat is not for you.</p>
    </section>

    <section>
      <h2>Not allowed</h2>
      <ul>
        <li>Sexual content, nudity, or sexual solicitation.</li>
        <li>Hate, harassment, threats, or bullying.</li>
        <li>Sharing someone&apos;s personal information (doxxing), or any content involving or targeting minors.</li>
        <li>Spam, scams, ads, or promotional links.</li>
        <li>Content that is illegal or encourages self-harm or violence.</li>
      </ul>
    </section>

    <section>
      <h2>Rooms</h2>
      <p>
        Each room may add its own rules on top of these guidelines. Room moderators can mute, kick, or ban people who
        break them, and we can act on any account or guest at any time.
      </p>
      <p>
        Private rooms (invite-only, members only) also exist. They follow these same guidelines, can be reported like any
        room, and we can close them and act on any account in them.
      </p>
    </section>
  </LegalPage>
);

export default Guidelines;
