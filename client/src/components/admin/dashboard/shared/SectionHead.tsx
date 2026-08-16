import type { ReactNode } from 'react';

type SectionHeadProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
};

const SectionHead = ({ title, subtitle, badge }: SectionHeadProps) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="font-display text-xl leading-none tracking-tight text-body">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1.5 text-sm text-body-300">{subtitle}</p>
      )}
    </div>
    {badge}
  </div>
);

export default SectionHead;
