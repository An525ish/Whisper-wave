import RefreshButton from '../../shared/RefreshButton';

type Props = {
  lastUpdated: string | null;
};

const DashboardHeader = ({ lastUpdated }: Props) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">
        Console
      </p>
      <h1 className="mt-1 font-semibold text-3xl leading-none tracking-tight text-body sm:text-4xl">
        Overview
      </h1>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {lastUpdated && (
        <p className="text-xs text-body-300/50">
          Refreshes every 30s · updated {lastUpdated}
        </p>
      )}
      <RefreshButton />
    </div>
  </header>
);

export default DashboardHeader;
