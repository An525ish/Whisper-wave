import type { SignupMethodFilter } from '@/types/admin';

type Tab = { id: SignupMethodFilter; label: string };

const TABS: Tab[] = [
  { id: 'all', label: 'All users' },
  { id: 'google', label: 'Google' },
  { id: 'email', label: 'Email' },
];

type SignupMethodFilterTabsProps = {
  value: SignupMethodFilter;
  onChange: (v: SignupMethodFilter) => void;
};

const SignupMethodFilterTabs = ({ value, onChange }: SignupMethodFilterTabsProps) => (
  <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
    {TABS.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
          value === tab.id
            ? 'border-blue/35 bg-blue/10 text-blue'
            : 'border-border/40 bg-primary/20 text-body-300 hover:border-border/60 hover:text-body'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default SignupMethodFilterTabs;
