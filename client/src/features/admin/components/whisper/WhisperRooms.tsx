import type { AdminWhisperStats } from '../../types';
import { Capsule, CountUp, Fact, KpiTile } from './WhisperExtras';
import { Panel, ShieldChips, pct } from './WhisperCharts';

type Props = {
  data?: AdminWhisperStats;
  range: 1 | 7 | 30;
  sum: Record<string, number>;
  series: (key: string) => number[];
};

const GREEN = '#01c36d';
const BLUE = '#3a9bd9';
const PINK = '#e96bb0';
const AMBER = '#f2b84b';

const SectionTitle = ({ title, hint }: { title: string; hint: string }) => (
  <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.07] pt-6">
    <h2 className="font-semibold text-xl text-body">{title}</h2>
    <p className="text-xs text-body-300">{hint}</p>
  </div>
);

const Live = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
  <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
    <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-body-300">
      <span className="size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
    </p>
    <p className="mt-1 font-semibold text-2xl tabular-nums text-body">{typeof value === 'number' ? <CountUp value={value} /> : value}</p>
  </div>
);

/** Signed-in vs guest, for Whisper and for Rooms, plus everything that happens in rooms. */
const WhisperRooms = ({ data, range, sum, series }: Props) => {
  const n = (k: string) => sum[k] ?? 0;
  const pick = (kind: string) => data?.uniques[kind]?.[range === 1 ? 'd1' : range === 7 ? 'd7' : 'd30'] ?? 0;
  const withPrefix = (p: string) =>
    Object.entries(sum)
      .filter(([k]) => k.startsWith(p))
      .map(([k, v]) => [k.slice(p.length), v] as [string, number])
      .sort((a, b) => b[1] - a[1]);

  const joins = n('rj_member') + n('rj_guest');
  const msgs = n('rm_member') + n('rm_guest');
  const guestPeople = pick('rooms_guest');
  const memberPeople = pick('rooms_member');
  const topRooms = withPrefix('rmsg:').slice(0, 6);
  const joinsBySlug = Object.fromEntries(withPrefix('rjoin:'));
  const live = data?.rooms;

  return (
    <>
      <SectionTitle title="Signed in vs guests" hint="different people, counted without storing who they are" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Whisper" hint="anonymous matchmaking">
          <Capsule rows={[['Signed in', pick('anon_user'), GREEN], ['Guests', pick('anon_guest'), AMBER]]} />
          <p className="mt-3 text-[11px] text-body-300/70">
            Partners never see accounts. Signed-in people only get quotas and blocks that follow them.
          </p>
        </Panel>
        <Panel title="Rooms" hint="public topic rooms">
          <Capsule rows={[['Members', memberPeople, GREEN], ['Guests', guestPeople, AMBER]]} />
          <p className="mt-3 text-[11px] text-body-300/70">
            {pct(guestPeople, guestPeople + memberPeople)} of room visitors are guests. Guests can't post media.
          </p>
        </Panel>
      </div>

      <SectionTitle title="Rooms" hint="live rooms live in memory, history starts from this deploy" />
      <div className="grid grid-cols-3 gap-3">
        <Live label="Members in rooms now" value={live?.members ?? '-'} color={GREEN} />
        <Live label="Guests in rooms now" value={live?.guests ?? '-'} color={AMBER} />
        <Live label="Open rooms" value={live?.instances ?? '-'} color={BLUE} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Room joins" value={joins} series={series('rj_member').map((v, i) => v + series('rj_guest')[i])} color={BLUE} hint="includes rejoins" />
        <KpiTile label="Room messages" value={msgs} series={series('rm_member').map((v, i) => v + series('rm_guest')[i])} color={GREEN} />
        <KpiTile label="Media posts" value={n('rmedia')} series={series('rmedia')} color={PINK} hint="members only" />
        <KpiTile label="Blocked posts" value={n('rblock_member') + n('rblock_guest')} series={series('rblock_guest')} color="#ef4444" hint={`${n('rblock_guest')} from guests`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Who posts" hint="messages and joins" className="lg:col-span-3">
          <Capsule rows={[['Member messages', n('rm_member'), GREEN], ['Guest messages', n('rm_guest'), AMBER]]} />
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <Fact label="Msgs per joiner" value={joins ? (msgs / joins).toFixed(1) : '-'} />
            <Fact label="Guest blocked rate" value={pct(n('rblock_guest'), n('rm_guest') + n('rblock_guest'))} hint="of guest posts" />
            <Fact label="Member blocked rate" value={pct(n('rblock_member'), n('rm_member') + n('rblock_member'))} hint="of member posts" />
          </div>
          <p className="mt-4 mb-2 text-[11px] text-body-300">Guest checks (first post)</p>
          <ShieldChips rows={withPrefix('rgate:').map(([k, v]) => [k.replace(/_/g, ' '), v] as [string, number])} />
        </Panel>
        <Panel title="Busiest rooms" hint="by messages" className="lg:col-span-2">
          {topRooms.length === 0 ? (
            <p className="text-xs text-body-300">No room posts yet.</p>
          ) : (
            <ol className="space-y-3">
              {topRooms.map(([slug, v], i) => (
                <li key={slug}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-body-300/60 tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-body">{slug}</span>
                    <span className="tabular-nums text-body-300">{v} msgs · {joinsBySlug[slug] ?? 0} joins</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-green/50 to-green" style={{ width: `${(v / topRooms[0][1]) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <Panel title="Why posts get blocked in rooms">
        <ShieldChips rows={withPrefix('rblock:').map(([k, v]) => [k.replace(/_/g, ' '), v] as [string, number])} />
      </Panel>
    </>
  );
};

export default WhisperRooms;
