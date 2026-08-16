type OnlineGaugeProps = {
  online: number;
  total: number;
};

const OnlineGauge = ({ online, total }: OnlineGaugeProps) => {
  const pct = total > 0 ? Math.min(100, Math.round((online / total) * 100)) : 0;

  return (
    <div className="flex h-full flex-col justify-end">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/45">
        <div
          className="h-full rounded-full bg-green transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default OnlineGauge;
