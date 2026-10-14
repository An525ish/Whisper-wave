import { LegalPage, LEGAL_CONTACT, LEGAL_RESPONSE } from '@/features/landing';

const ReportAbuse = () => (
  <LegalPage
    title="Report abuse"
    intro="Something felt wrong? Tell us. Reports go to our safety team and help keep Whisper Wave a place people can trust."
  >
    <section>
      <h2>In the moment</h2>
      <p>
        Every conversation has safety controls built in. If someone crosses a line, you don&apos;t have to explain
        yourself:
      </p>
      <ul>
        <li>
          <strong>Report</strong> — flags the conversation to our team. We see it.
        </li>
        <li>
          <strong>Block</strong> — cuts that person from your wave immediately.
        </li>
        <li>
          <strong>Safe exit</strong> — leaves instantly, with no goodbye note sent to your partner.
        </li>
      </ul>
    </section>

    <section>
      <h2>What to report</h2>
      <ul>
        <li>Harassment, threats, or hateful behaviour.</li>
        <li>Any sexual content involving minors, or someone you believe is under 18.</li>
        <li>Scams, spam, or attempts to solicit money or personal information.</li>
        <li>Content encouraging self-harm or violence.</li>
        <li>Anyone recording or sharing conversations without consent.</li>
      </ul>
    </section>

    <section>
      <h2>Report to our team</h2>
      <p>
        For anything urgent or serious, email{' '}
        <a href={`mailto:${LEGAL_CONTACT.safetyEmail}`}>{LEGAL_CONTACT.safetyEmail}</a>. If you can, include the vibe name you were
        talking to and roughly when it happened — it helps us act faster. You can report anonymously; you don&apos;t need
        an account.
      </p>
    </section>

    <section>
      <h2>Grievance officer</h2>
      <p>
        Our grievance officer handles complaints about content on Whisper Wave — including requests to remove
        intimate or sexual content.
      </p>
      <ul>
        <li>
          <strong>Officer</strong> — {LEGAL_CONTACT.grievanceOfficer}
        </li>
        <li>
          <strong>Contact</strong> — <a href={`mailto:${LEGAL_CONTACT.email}`}>{LEGAL_CONTACT.email}</a>
        </li>
        <li>
          <strong>Acknowledgement</strong> — within {LEGAL_RESPONSE.acknowledgeHours} hours of every complaint.
        </li>
        <li>
          <strong>Nudity, sexual or impersonation content</strong> — actioned within {LEGAL_RESPONSE.urgentRemovalHours}{' '}
          hours.
        </li>
        <li>
          <strong>All other complaints</strong> — resolved within {LEGAL_RESPONSE.resolveDays} days.
        </li>
      </ul>
    </section>

    <section>
      <h2>If someone is in danger</h2>
      <p>
        Whisper Wave isn&apos;t an emergency service. If you or someone else is in immediate danger, contact your local
        emergency number first.
      </p>
    </section>
  </LegalPage>
);

export default ReportAbuse;
