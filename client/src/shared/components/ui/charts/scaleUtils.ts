/**
 * Y-axis bounds for count-based charts (0..n signups, messages, etc.).
 * Keeps curves/bars readable when max is 0–2 and still scales for large values.
 */
export const countChartYBounds = (values: number[]): { min: number; max: number } => {
  const nums = values.filter((v) => Number.isFinite(v));
  const maxVal = nums.length > 0 ? Math.max(...nums) : 0;

  if (maxVal <= 0) {
    return { min: 0, max: 4 };
  }

  const headroom =
    maxVal <= 1
      ? 3
      : maxVal <= 3
        ? 2
        : maxVal <= 10
          ? Math.max(2, Math.ceil(maxVal * 0.4))
          : Math.max(1, Math.ceil(maxVal * 0.12));

  return { min: 0, max: niceCeil(maxVal + headroom) };
};

const niceCeil = (value: number): number => {
  if (value <= 5) return Math.max(4, Math.ceil(value));
  if (value <= 20) return Math.ceil(value);
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
};

export const countYTickStep = (max: number): number | undefined =>
  max <= 10 ? 1 : undefined;

/** Monotone splines avoid dipping below zero on tiny counts */
export const countLineTension = (values: number[]): number => {
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  return maxVal <= 3 ? 0.3 : 0.45;
};
