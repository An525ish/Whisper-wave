import { LegalPage, LEGAL_CONTACT, LEGAL_UPDATED } from '@/features/landing';

const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    updated={LEGAL_UPDATED}
    intro="Whisper Wave is built to collect as little about you as possible. This policy explains what we handle, why, and the choices you have."
  >
    <section>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Vibe name and vibe tag</strong> — the made-up handle you choose for a session. No real name or photo
          is required.
        </li>
        <li>
          <strong>Account details</strong> — only created after a mutual spark, so persistent DMs work. This may
          include an email or login identifier you provide.
        </li>
        <li>
          <strong>Technical data</strong> — basic device and connection info needed to run the service and keep it
          secure.
        </li>
        <li>
          <strong>Guest identifiers</strong> — random, httpOnly cookies with no account attached: the anonymous
          session id (24 hours) and a stable guest id, <code>gid</code> (30 days), used only for safety — abuse
          control, rate-limit continuity, and restoring your persona on return visits.
        </li>
      </ul>
    </section>

    <section>
      <h2>What we don&apos;t do</h2>
      <p>
        We don&apos;t build advertising profiles, we don&apos;t sell your data, and we don&apos;t run a public feed or follower
        graph. Anonymous conversations aren&apos;t tied to a real-world identity.
      </p>
    </section>

    <section>
      <h2>Ephemeral by design</h2>
      <p>
        Anonymous chat sessions are not stored after they end. When you skip or leave, the conversation is gone.
        Messages in a mutual-spark DM persist only while both accounts exist, and are removed when an account is
        deleted.
      </p>
    </section>

    <section>
      <h2>Rooms</h2>
      <p>
        Live topic rooms are ephemeral. Room messages are not stored, except when a message is reported: we then keep
        a snapshot of the reported message and the messages around it. A snapshot holds only the alias, the text and
        the time — no IP address. Guests in rooms carry the <code>gid</code> cookie described above, for safety only.
      </p>
    </section>

    <section>
      <h2>Memes and jokes</h2>
      <ul>
        <li>The joke text comes from JokeAPI, fetched through our server.</li>
        <li>
          Meme images are rendered by api.memegen.link. Your browser contacts Memegen directly, which exposes your IP
          address and user agent to that host.
        </li>
        <li>Members&apos; saved memes are stored on their account.</li>
        <li>
          The optional 18+ declaration for unfiltered jokes is stored on your account. Guests&apos; reactions and hidden
          jokes stay on their device.
        </li>
      </ul>
    </section>

    <section>
      <h2>Safety and moderation</h2>
      <p>
        When someone reports abuse, we retain the report evidence so we can review it and act. We delete it 90 days
        after the report is resolved, or after 1 year for child-safety matters. This is to protect people using
        Whisper Wave and to meet legal obligations.
      </p>
      <p>
        Moderation actions such as mutes and bans are keyed to your <code>gid</code> and/or your account. Ban records
        expire.
      </p>
    </section>

    <section>
      <h2>Your choices</h2>
      <ul>
        <li>Leave or skip a conversation at any time — it disappears.</li>
        <li>Delete your account to remove your persistent DMs and account details.</li>
        <li>Contact us to ask what account data we hold about you.</li>
      </ul>
    </section>

    <section>
      <h2>Contact</h2>
      <p>
        For privacy questions or data requests, email{' '}
        <a href={`mailto:${LEGAL_CONTACT.privacyEmail}`}>{LEGAL_CONTACT.privacyEmail}</a>.
      </p>
    </section>
  </LegalPage>
);

export default Privacy;
