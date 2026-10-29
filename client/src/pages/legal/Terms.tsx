import { Link } from 'react-router-dom';
import { LegalPage, LEGAL_CONTACT, LEGAL_UPDATED } from '@/features/landing';

const Terms = () => (
  <LegalPage
    title="Terms of Service"
    updated={LEGAL_UPDATED}
    intro="These terms cover how you use Whisper Wave. By creating a session or an account, you agree to them. We've kept the language plain — the goal is a safe, respectful place to talk to strangers."
  >
    <section>
      <h2>Who can use Whisper Wave</h2>
      <p>
        You must be 18 or older to use Whisper Wave. By entering the queue or using rooms you confirm that you meet
        this age requirement. We may end access for anyone we believe is under 18 or is misusing the service.
      </p>
    </section>

    <section>
      <h2>Your identity and account</h2>
      <p>
        Whisper Wave is anonymous by default — you pick a vibe name, not a real profile. When two people share a
        mutual spark, a lightweight account is created so your direct messages can persist. You&apos;re responsible for
        activity that happens under your name and for keeping your login details private.
      </p>
    </section>

    <section>
      <h2>Acceptable use</h2>
      <p>To keep conversations safe, you agree not to:</p>
      <ul>
        <li>Harass, threaten, or abuse other people.</li>
        <li>Share sexual content involving minors, or attempt to contact minors.</li>
        <li>Post spam, scams, or attempts to solicit money or personal data.</li>
        <li>Share content that is illegal, hateful, or promotes self-harm or violence.</li>
        <li>Record, screenshot, or redistribute another person&apos;s messages without consent.</li>
        <li>Attempt to break, scrape, or reverse-engineer the service.</li>
      </ul>
    </section>

    <section>
      <h2>Ephemeral conversations</h2>
      <p>
        Anonymous conversations are designed to disappear. When you skip or leave, that session ends and isn&apos;t
        recoverable. Persistent direct messages exist only after a mutual spark, and only for as long as both
        accounts remain active.
      </p>
    </section>

    <section>
      <h2>Rooms</h2>
      <p>
        Live rooms are public, ephemeral group conversations. Messages vanish when the room empties or restarts. In
        rooms you agree to follow the{' '}
        <Link to="/guidelines">Community Guidelines</Link> and any rules the room sets. Room moderators and Whisper
        Wave may mute, kick, or ban you. Creating a room makes you its host: you agree to enforce its rules, and
        abusive rooms may be closed without warning. When someone reports a message, we keep a small snapshot around it
        (alias, text, and time) so a human can review it.
      </p>
      <p>
        Rooms created by new accounts stay unlisted until an admin approves them. Established accounts may list a
        room instantly. We can unlist or remove any room at any time.
      </p>
    </section>

    <section>
      <h2>Ending access</h2>
      <p>
        You can stop using Whisper Wave at any time. We may suspend, ban, or remove access, by account and/or guest
        id, if these terms are broken, if we&apos;re required to by law, or to protect people using the service.
        Ban records expire.
      </p>
    </section>

    <section>
      <h2>Changes and contact</h2>
      <p>
        We may update these terms as the product evolves; we&apos;ll revise the date above when we do. Questions? Reach us
        at <a href={`mailto:${LEGAL_CONTACT.helloEmail}`}>{LEGAL_CONTACT.helloEmail}</a>.
      </p>
    </section>
  </LegalPage>
);

export default Terms;
