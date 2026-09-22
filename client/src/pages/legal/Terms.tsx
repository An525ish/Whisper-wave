import LegalPage from '@/components/landing/LegalPage';

const Terms = () => (
  <LegalPage
    title="Terms of Service"
    updated="September 2026"
    intro="These terms cover how you use Whisper Wave. By creating a session or an account, you agree to them. We've kept the language plain — the goal is a safe, respectful place to talk to strangers."
  >
    <section>
      <h2>Who can use Whisper Wave</h2>
      <p>
        You must be 18 or older to use Whisper Wave. By entering the queue you confirm that you meet this age
        requirement. We may end access for anyone we believe is under 18 or is misusing the service.
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
      <h2>Ending access</h2>
      <p>
        You can stop using Whisper Wave at any time. We may suspend or remove access if these terms are broken, if
        we&apos;re required to by law, or to protect people using the service.
      </p>
    </section>

    <section>
      <h2>Changes and contact</h2>
      <p>
        We may update these terms as the product evolves; we&apos;ll revise the date above when we do. Questions? Reach us
        at <a href="mailto:hello@whisperwave.app">hello@whisperwave.app</a>.
      </p>
    </section>
  </LegalPage>
);

export default Terms;
