import LegalPage from '@/components/landing/LegalPage';

const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    updated="September 2026"
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
      <h2>Safety and moderation</h2>
      <p>
        When someone reports abuse, we may retain the relevant report details for a limited time so we can review it
        and act. This is to protect people using Whisper Wave and to meet legal obligations.
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
        <a href="mailto:privacy@whisperwave.app">privacy@whisperwave.app</a>.
      </p>
    </section>
  </LegalPage>
);

export default Privacy;
