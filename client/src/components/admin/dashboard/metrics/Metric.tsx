import type { ReactNode } from 'react';

type MetricProps = {
  label: string;
  value: number | string;
  accent: string;
  hint: string;
  spark: ReactNode;
};

const Metric = ({ label, value, accent, hint, spark }: MetricProps) => (
  <div className="flex min-h-36 min-w-22 flex-1 flex-col px-4 first:pl-0 last:pr-0 sm:min-w-28">
    <p className={`font-display text-3xl leading-none tabular-nums sm:text-4xl ${accent}`}>
      {value}
    </p>
    <p className="mt-2 text-xs font-medium text-body-300">{label}</p>
    <p className="mt-0.5 min-h-3.5 text-[10px] leading-snug text-body-300/55">{hint}</p>
    <div className="mt-auto h-10 w-full max-w-32 pt-3 opacity-90">{spark}</div>
  </div>
);

export default Metric;
