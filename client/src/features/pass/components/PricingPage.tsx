import './pricing.css';
import { useId, useState } from 'react';
import { useHubSummary } from '@/features/hub';
import BoostSection from './BoostSection';
import PassCheckout from './PassCheckout';

const Tick = ({ label }: { label: string }) => (
  <>
    <span aria-hidden className="pricing-tick">
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
    <span className="sr-only">{label}</span>
  </>
);

const Dash = () => (
  <>
    <span aria-hidden className="pricing-dash" />
    <span className="sr-only">Not included</span>
  </>
);

type Row = { label: string; hint?: string; free: boolean };

/** What each side gets. Free is the baseline, so Spark Pass always has every row. */
const ROWS: Row[] = [
  { label: 'One-to-one anonymous chats', free: true },
  { label: 'Report and block tools', free: true },
  { label: 'Pick a gender to meet', hint: 'Held for 20 seconds, then anyone', free: false },
  { label: 'Go first when matches are equal', free: false },
  { label: 'No ads', hint: 'Free accounts see a couple of small ads', free: false },
];

const PRIVATE_ROOMS: Row = { label: 'Create private rooms', hint: 'Invite-only, up to 25 people', free: false };

const FAQ = [
  {
    q: 'What if nobody fits my pick?',
    a: 'We hold your pick for 20 seconds. After that you are matched with anyone, so you never wait for nothing.',
  },
  {
    q: 'Does it renew?',
    a: 'No. One payment, one fixed length. Buy again before it ends and the time adds on.',
  },
  {
    q: 'How do I pay?',
    a: 'UPI, cards and netbanking through Razorpay. Card and UPI details go to Razorpay, not to us.',
  },
  {
    q: 'Where do I use it?',
    a: 'On the Whisper screen. With a pass, the "Pick who you meet" options unlock before you tap Find someone.',
  },
];

/** One FAQ row. Height animates with the 0fr to 1fr grid trick, which works in every browser. */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`pricing-faq__item${open ? ' pricing-faq__item--open' : ''}`}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {q}
          <span aria-hidden className="pricing-faq__icon" />
        </button>
      </h3>
      <div id={id} role="region" className="pricing-faq__panel" inert={!open}>
        <div className="pricing-faq__panel-inner">
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}

/** Pricing: pick a length, buy, then see exactly what changes. */
export default function PricingPage() {
  const privateRooms = useHubSummary().data?.features.privateRooms ?? false;
  const rows = privateRooms ? [...ROWS, PRIVATE_ROOMS] : ROWS;

  return (
    <div className="pricing">
      <header className="pricing__head">
        <p className="pricing__eyebrow">
          <span aria-hidden>✦</span> Spark Pass
        </p>
        <h1 className="pricing__title font-display">Whisper is free. Pay to pick who you meet.</h1>
        <p className="pricing__sub">One payment for a day, a week, a month or a year. Nothing renews on its own. Boosts are separate and optional.</p>
      </header>

      <PassCheckout />

      <BoostSection />

      <section className="pricing-compare" aria-labelledby="pricing-compare-title">
        <h2 id="pricing-compare-title" className="pricing-section-title font-display">What changes</h2>
        <table className="pricing-table">
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Feature</span></th>
              <th scope="col">Free</th>
              <th scope="col" className="pricing-table__pass"><span aria-hidden>✦</span> Spark Pass</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">
                  {r.label}
                  {r.hint && <span className="pricing-table__hint">{r.hint}</span>}
                </th>
                <td>{r.free ? <Tick label="Included" /> : <Dash />}</td>
                <td className="pricing-table__pass"><Tick label="Included" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="pricing-faq" aria-labelledby="pricing-faq-title">
        <h2 id="pricing-faq-title" className="pricing-section-title font-display">Questions</h2>
        {FAQ.map((item) => (
          <FaqItem key={item.q} {...item} />
        ))}
        <p className="pricing-faq__more">
          Refunds and payment rules are in the <a href="/terms">Terms</a>.
        </p>
      </section>
    </div>
  );
}
