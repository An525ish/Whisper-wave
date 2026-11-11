import { LegalPage, LEGAL_CONTACT, LEGAL_UPDATED } from '@/features/landing';

const Cookies = () => (
  <LegalPage
    title="Cookies"
    updated={LEGAL_UPDATED}
    intro="We use only the cookies and device storage needed to run and protect Whisper Wave. This page is general information, not legal advice."
  >
    <section>
      <h2>Cookies we set</h2>
      <p>All are httpOnly, so page scripts cannot read them.</p>
      <ul>
        <li>
          <strong>Auth tokens</strong> — access and refresh tokens that keep you signed in.
        </li>
        <li>
          <strong>anonId</strong> — your anonymous session, lasts 24 hours.
        </li>
        <li>
          <strong>gid</strong> — a guest id, lasts 30 days. Used only for safety: bans, rate-limit continuity, and
          restoring your persona.
        </li>
        <li>
          <strong>Admin token</strong> — set only for staff signing in to the admin area.
        </li>
      </ul>
    </section>

    <section>
      <h2>Third-party bot check</h2>
      <p>
        The first time a guest posts in a room, a Cloudflare Turnstile check loads from Cloudflare. Cloudflare may set
        its own cookies or storage to tell humans from bots. It loads only at that moment and is not used for
        advertising or tracking.
      </p>
    </section>

    <section>
      <h2>Ads (only if you allow them)</h2>
      <p>
        If you tap &quot;Show ads&quot;, Google AdSense loads on the waiting screen and the screen after a chat. Google may
        set its own cookies or storage to serve and measure the ad. Nothing from Google loads before you agree, and
        Spark Pass holders never load it. Your choice is saved on this device as <strong>ww-ad-consent</strong>.
      </p>
    </section>

    <section>
      <h2>What we don&apos;t use</h2>
      <p>No tracking cookies of our own, and no advertising cookies unless you allow ads above.</p>
    </section>

    <section>
      <h2>Device storage</h2>
      <p>
        Your browser&apos;s local storage keeps your persona, your meme preferences and hidden jokes, and your ads choice. This stays on your
        device and is not sent to us. Clearing your browser data removes it.
      </p>
    </section>

    <section>
      <h2>Questions</h2>
      <p>
        Email <a href={`mailto:${LEGAL_CONTACT.privacyEmail}`}>{LEGAL_CONTACT.privacyEmail}</a>.
      </p>
    </section>
  </LegalPage>
);

export default Cookies;
