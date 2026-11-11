import type { SignupMethodFilter, SparkPassFilter } from '../../../types';

const SIGNUP_TABS: { id: SignupMethodFilter; label: string }[] = [
  { id: 'all', label: 'All users' },
  { id: 'google', label: 'Google' },
  { id: 'email', label: 'Email' },
];

type Props = {
  signupMethod: SignupMethodFilter;
  onSignupMethodChange: (v: SignupMethodFilter) => void;
  sparkPass: SparkPassFilter;
  onSparkPassChange: (v: SparkPassFilter) => void;
};

const SignupMethodFilterTabs = ({
  signupMethod,
  onSignupMethodChange,
  sparkPass,
  onSparkPassChange,
}: Props) => {
  const passOn = sparkPass === 'active';

  return (
    <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
      {SIGNUP_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSignupMethodChange(tab.id)}
          className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
            signupMethod === tab.id
              ? 'border-blue/35 bg-blue/10 text-blue'
              : 'border-border/40 bg-primary/20 text-body-300 hover:border-border/60 hover:text-body'
          }`}
        >
          {tab.label}
        </button>
      ))}
      <span className="hidden h-4 w-px bg-border/50 sm:inline" aria-hidden />
      <button
        type="button"
        onClick={() => onSparkPassChange(passOn ? 'all' : 'active')}
        className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
          passOn
            ? 'border-gold/40 bg-gold/12 text-gold'
            : 'border-border/40 bg-primary/20 text-body-300 hover:border-border/60 hover:text-body'
        }`}
      >
        <span aria-hidden>✦</span> Spark Pass
      </button>
    </div>
  );
};

export default SignupMethodFilterTabs;
