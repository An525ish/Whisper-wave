/** UTC day keys — must match $dateToString timezone in countCreatedByDay aggregations */
export const STATS_BUCKET_TZ = 'UTC';

const DAY_MS = 24 * 60 * 60 * 1000;

export const buildLast7DayBuckets = async (
  countByDay: (start: Date, end: Date) => Promise<{ _id: string; count: number }[]>,
): Promise<{ labels: string[]; values: number[] }> => {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
  );
  const start = new Date(end.getTime() - 6 * DAY_MS);
  start.setUTCHours(0, 0, 0, 0);

  const rows = await countByDay(start, end);
  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  const labels: string[] = [];
  const values: number[] = [];

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start.getTime() + i * DAY_MS);
    const key = day.toISOString().slice(0, 10);
    labels.push(
      day.toLocaleDateString('en-US', { weekday: 'short', timeZone: STATS_BUCKET_TZ }),
    );
    values.push(byDay.get(key) ?? 0);
  }

  return { labels, values };
};
