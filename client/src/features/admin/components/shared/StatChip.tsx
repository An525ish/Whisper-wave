type Props = {
  label: string;
  value: number | string;
  accent: string;
};

const StatChip = ({ label, value, accent }: Props) => (
  <div className="min-w-0 flex-1 px-4 first:pl-0 last:pr-0">
    <p className={`font-semibold text-2xl leading-none tabular-nums sm:text-3xl ${accent}`}>
      {value}
    </p>
    <p className="mt-1.5 text-xs font-medium text-body-300">{label}</p>
  </div>
);

export default StatChip;
