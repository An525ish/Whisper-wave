import { Link } from 'react-router-dom';
import { LegalPage,LEGAL_CONTACT, LEGAL_RESPONSE, LEGAL_UPDATED } from '@/features/landing';

const Safety = () => (
  <LegalPage
    title="Safety"
    updated={LEGAL_UPDATED}
    intro="How we keep Whisper Wave safe, and what you can do. This page is general information, not legal advice."
  >
    <section>
      <h2>Tools you control</h2>
      <ul>
        <li>
          <strong>Report</strong> — flag a person or message to our team.
        </li>
        <li>
          <strong>Block</strong> — cut someone off from you immediately.
        </li>
        <li>
          <strong>Room moderators</strong> — can mute, kick, or ban people in their room.
        </li>
      </ul>
    </section>

    <section>
      <h2>How reports work</h2>
      <p>
        A report saves a snapshot of the reported message and the messages around it (alias, text, and time). A
        human reviews it and may warn, mute, ban, or remove content. See our{' '}
        <Link to="/privacy">Privacy Policy</Link> for how long evidence is kept.
      </p>
    </section>

    <section>
      <h2>Response times</h2>
      <ul>
        <li>
          Sexual content, nudity, and impersonation: removal targeted within {LEGAL_RESPONSE.urgentRemovalHours} hours.
        </li>
        <li>
          Other complaints: acknowledged within {LEGAL_RESPONSE.acknowledgeHours} hours and resolved within{' '}
          {LEGAL_RESPONSE.resolveDays} days.
        </li>
      </ul>
      <p>
        Write to <a href={`mailto:${LEGAL_CONTACT.email}`}>{LEGAL_CONTACT.email}</a> or see{' '}
        <Link to="/report">Report abuse</Link>.
      </p>
    </section>

    <section>
      <h2>Child safety</h2>
      <p>
        Report any sexual content involving minors immediately using Report, or email{' '}
        <a href={`mailto:${LEGAL_CONTACT.safetyEmail}`}>{LEGAL_CONTACT.safetyEmail}</a>. You can also report to your
        national authority or child-protection hotline.
      </p>
    </section>

    <section>
      <h2>If you need help</h2>
      <p>
        Whisper Wave is not a crisis or emergency service. If you or someone else is in danger, contact your local
        emergency number. If you are struggling, please reach out to a local helpline or someone you trust.
      </p>
    </section>
  </LegalPage>
);

export default Safety;
