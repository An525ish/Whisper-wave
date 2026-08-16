import { useMemo } from 'react';
import type { ChartOptions, ScriptableContext } from 'chart.js';
import {
  countChartYBounds,
  countLineTension,
} from '@/components/ui/charts/scaleUtils';
import { useChart } from '@/components/ui/charts/useChart';

export type SparkVariant = 'blue' | 'gold' | 'green' | 'coral' | 'yellow';

const SPARK_THEMES: Record<
  SparkVariant,
  { line: string; fillTop: string; fillBottom: string; hover: string }
> = {
  blue: {
    line: '#5698FF',
    fillTop: 'rgba(86,152,255,0.3)',
    fillBottom: 'rgba(86,152,255,0)',
    hover: '#5698FF',
  },
  gold: {
    line: '#D4AA5A',
    fillTop: 'rgba(212,170,90,0.35)',
    fillBottom: 'rgba(212,170,90,0)',
    hover: '#D4AA5A',
  },
  green: {
    line: '#01C36D',
    fillTop: 'rgba(1,195,109,0.32)',
    fillBottom: 'rgba(1,195,109,0)',
    hover: '#01C36D',
  },
  coral: {
    line: '#FF7B85',
    fillTop: 'rgba(255,123,133,0.32)',
    fillBottom: 'rgba(255,123,133,0)',
    hover: '#FF7B85',
  },
  yellow: {
    line: '#ECC347',
    fillTop: 'rgba(236,195,71,0.32)',
    fillBottom: 'rgba(236,195,71,0)',
    hover: '#ECC347',
  },
};

type SingleAreaChartProps = {
  labels?: string[];
  values?: number[];
  label?: string;
  variant?: SparkVariant;
  /** Adds vertical breathing room — use for larger pulse charts */
  inset?: boolean;
};

const SingleAreaChart = ({
  labels = [],
  values = [],
  label = 'Trend',
  variant = 'blue',
  inset = false,
}: SingleAreaChartProps) => {
  const theme = SPARK_THEMES[variant];
  const series = values.length > 0 ? values : [0, 0, 0, 0, 0, 0, 0];
  const yBounds = countChartYBounds(series);

  const data = useMemo(
    () => ({
      labels: labels.length > 0 ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label,
          data: series,
          tension: countLineTension(series),
          cubicInterpolationMode: 'monotone' as const,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointHoverBackgroundColor: theme.hover,
          borderColor: theme.line,
          borderWidth: 1.5,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            if (!context.chart.chartArea) return 'transparent';
            const { ctx, chartArea: { top, bottom } } = context.chart;
            const gradient = ctx.createLinearGradient(0, top, 0, bottom);
            gradient.addColorStop(0, theme.fillTop);
            gradient.addColorStop(1, theme.fillBottom);
            return gradient;
          },
        },
      ],
    }),
    [labels, series, label, theme],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      fill: true,
      maintainAspectRatio: false,
      layout: inset
        ? { padding: { top: 14, bottom: 10, left: 2, right: 2 } }
        : { padding: { top: 6, bottom: 4, left: 0, right: 0 } },
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          display: false,
          min: yBounds.min,
          max: yBounds.max,
        },
        x: { display: false },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgb(42 33 54)',
          borderColor: 'rgb(53 47 61)',
          borderWidth: 1,
          titleColor: 'rgba(235,236,236,0.45)',
          bodyColor: '#ebecec',
          padding: 8,
          cornerRadius: 6,
          displayColors: false,
        },
      },
    }),
    [inset, yBounds.min, yBounds.max],
  );

  const canvasRef = useChart({ type: 'line', data, options });

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} width={350} height={120} />
    </div>
  );
};

export default SingleAreaChart;
