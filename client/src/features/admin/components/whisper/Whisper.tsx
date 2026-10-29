import { useState } from 'react';
import { useWhisperStatsQuery } from '../../hooks';
import RefreshButton from '../shared/RefreshButton';
import WhisperRadar from './WhisperRadar';
import WhisperRooms from './WhisperRooms';
import { DayClock, TopVibes } from './WhisperVibes';
import { Capsule, CountUp, Fact, HeatDays, KpiTile } from './WhisperExtras';
import { AreaTrend, Journey, Panel, ShieldChips, SplitBar, pct } from './WhisperCharts';

const RANGES = [1, 7, 30] as const;
const GENDERS: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other', prefer_not_to_say: 'Not said' };
const GENDER_COLORS = ['#3a9bd9', '#e96bb0', '#a98bf5', '#6b7280'];

const Big = ({ value, label, dot }: { value: number | string; label: string; dot: string }) => (
  <div>
    <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-body-300">
      <span className={`size-2 rounded-full ${dot}`} />
      {label}
    </p>
    <p className="mt-1 font-semibold text-6xl leading-none tabular-nums text-body">{typeof value === 'number' ? <CountUp value={value} /> : value}</p>
  </div>
);

const Mini = ({ label, value, hint }: { label: string; value: string | number; hint: string }) => (
  <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-body-300">{label}</p>
    <p className="mt-1 font-semibold text-xl tabular-nums text-body">{value}</p>
    <p className="text-[10px] text-body-300/70">{hint}</p>
  </div>
);

const Whisper = () => {
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);
  const { data } = useWhisperStatsQuery(30);

  const all = data?.days ?? [];
  const sum: Record<string, number> = {};
  for (const d of all.slice(-range)) for (const [k, v] of Object.entries(d.counters)) sum[k] = (sum[k] ?? 0) + v;
  const n = (k: string) => sum[k] ?? 0;
  const withPrefix = (p: string) =>
    Object.entries(sum)
      .filter(([k]) => k.startsWith(p))
      .map(([k, v]) => [k.slice(p.length), v] as [string, number])
      .sort((a, b) => b[1] - a[1]);

  const joined = n('joined');
  const trendDays = all.slice(-Math.max(range, 7));
  const series = (k: string) => trendDays.map((d) => d.counters[k] ?? 0);
  const days30 = all.map((d) => ({ date: d.date, v: d.counters.joined ?? 0 }));
  const ended = n('ended');
  const other = Math.max(ended - n('end_skip') - n('end_drop'), 0);
  const reacts = withPrefix('react:').slice(0, 6);
  const avgMin = n('ended') ? `${(n('dur_ms') / n('ended') / 60000).toFixed(1)}m` : '-';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
          <h1 className="mt-1 font-semibold text-3xl leading-none tracking-tight text-body sm:text-4xl">Whisper</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-white/10 bg-black-light/35 p-0.5">
            {RANGES.map((r) => (
              <button key={r} type="button" onClick={() => setRange(r)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${range === r ? 'bg-green text-black shadow-[0_0_14px_rgba(1,195,109,.5)]' : 'text-body-300 hover:text-body'}`}>
                {r === 1 ? 'Today' : `${r} days`}
              </button>
            ))}
          </div>
          <RefreshButton />
        </div>
      </header>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-primary/50 p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-20 top-0 size-80 rounded-full bg-green/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 size-72 rounded-full bg-blue/15 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-2">
          <WhisperRadar searching={data?.live.queue ?? 0} chats={data?.live.chats ?? 0} />
          <div className="flex flex-col gap-6">
            <div className="flex gap-10">
              <Big value={data?.live.chats ?? '-'} label="Chatting" dot="bg-green shadow-[0_0_8px_#01c36d]" />
              <Big value={data?.live.queue ?? '-'} label="Searching" dot="bg-blue shadow-[0_0_8px_#3a9bd9]" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <Mini label="Joined" value={joined} hint={`${n('joined_user')} signed in`} />
              <Mini label="Match rate" value={pct(n('matched'), joined)} hint={`${n('matched')} chats`} />
              <Mini label="Avg chat" value={avgMin} hint={`${pct(n('short'), n('ended'))} under 30s`} />
            </div>
            <div>
              <p className="mb-1 text-[11px] text-body-300">Joins per day</p>
              <AreaTrend values={trendDays.map((d) => d.counters.joined ?? 0)} labels={trendDays.map((d) => d.date.slice(5))} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiTile label="Joined" value={joined} series={series('joined')} color="#3a9bd9" hint={`${n('joined_guest')} guests`} />
        <KpiTile label="Chats" value={n('matched')} series={series('matched')} color="#01c36d" hint={`${pct(n('matched'), joined)} match rate`} />
        <KpiTile label="Messages" value={n('sent')} series={series('sent')} color="#19b6a0" hint={ended ? `${(n('msgs') / ended).toFixed(1)} per chat` : undefined} />
        <KpiTile label="Photos" value={n('photo')} series={series('photo')} color="#e96bb0" hint={ended ? `${((n('photo') / ended) * 100).toFixed(0)} per 100 chats` : undefined} />
        <KpiTile label="GIFs and memes" value={n('gif')} series={series('gif')} color="#f2b84b" />
        <KpiTile label="Reactions" value={n('reaction')} series={series('reaction')} color="#a98bf5" />
      </div>

      <Panel title="The journey" hint="from joining to a real connection">
        <Journey steps={[['Joined', joined], ['Matched', n('matched')], ['Both talked', n('conversed')], ['Mutual vibe', n('mutual')]]} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="What people send" hint="every accepted message">
          <Capsule rows={[['Text', n('text'), '#3a9bd9'], ['Photos', n('photo'), '#e96bb0'], ['GIFs and memes', n('gif'), '#f2b84b']]} />
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <Fact label="Messages" value={n('sent')} />
            <Fact label="Per chat" value={ended ? (n('msgs') / ended).toFixed(1) : '-'} />
            <Fact label="Reactions" value={n('reaction')} hint={pct(n('reaction'), n('sent'))} />
          </div>
          {reacts.length > 0 && (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-body-300">
              Top reactions
              {reacts.map(([e, v]) => <span key={e} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-body">{e} {v}</span>)}
            </p>
          )}
        </Panel>
        <Panel title="How chats end" hint={`${ended} finished`}>
          <Capsule rows={[['Someone skipped', n('end_skip'), '#e96bb0'], ['Connection dropped', n('end_drop'), '#f2b84b'], ['Other', other, '#6b7280']]} />
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <Fact label="Vibes sent" value={n('like')} hint={`${pct(n('like'), n('matched'))} of chats`} />
            <Fact label="Mutual" value={n('mutual')} hint={`${pct(n('mutual'), n('matched'))} of chats`} />
            <Fact label="User reports" value={n('report')} hint={`${pct(n('report'), n('matched'))} of chats`} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Top vibes" hint="bubble = how often picked" className="lg:col-span-3">
          <TopVibes rows={withPrefix('tag:').slice(0, 14)} total={joined} />
        </Panel>
        <Panel title="Day clock" hint="your local time" className="lg:col-span-2">
          <DayClock hours={Array.from({ length: 24 }, (_, h) => n(`hour:${h}`))} />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Who joins" className="lg:col-span-3">
          <SplitBar rows={withPrefix('gender:').map(([k, v]) => [GENDERS[k] ?? k, v] as [string, number])} colors={GENDER_COLORS} />
        </Panel>
        <Panel title="Safety" hint={`${n('blocked')} blocked, ${n('auto_report')} reported`} className="lg:col-span-2">
          <ShieldChips rows={withPrefix('blocked:').map(([k, v]) => [k.replace(/_/g, ' '), v] as [string, number])} />
        </Panel>
      </div>

      <WhisperRooms data={data} range={range} sum={sum} series={series} />

      <Panel title="Last 30 days" hint="brighter = more joins">
        <HeatDays days={days30} />
      </Panel>

      <p className="text-center text-[11px] text-body-300/60">
        Anonymous totals only. No names, chats or ids are stored. History starts from when this shipped.
      </p>
    </div>
  );
};

export default Whisper;
