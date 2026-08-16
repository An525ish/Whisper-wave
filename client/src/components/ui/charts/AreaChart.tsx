import { useMemo } from 'react';
import type { ChartOptions, ScriptableContext } from 'chart.js';
import {
  countChartYBounds,
  countLineTension,
} from '@/components/ui/charts/scaleUtils';
import { useChart } from '@/components/ui/charts/useChart';

const TOOLTIP: ChartOptions<'line'>['plugins'] = {
  tooltip: {
    mode: 'index',
    intersect: false,
    backgroundColor: 'rgb(42 33 54)',
    borderColor: 'rgb(53 47 61)',
    borderWidth: 1,
    titleColor: 'rgba(235,236,236,0.45)',
    bodyColor: '#ebecec',
    padding: 10,
    cornerRadius: 8,
    displayColors: false,
  },
  legend: {
    display: false,
  },
};

type AreaChartProps = {
  labels?: string[];
  values?: number[];
  label?: string;
};

const AreaChart = ({ labels = [], values = [], label = 'New users' }: AreaChartProps) => {
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
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#5698FF',
          pointHoverBorderColor: 'rgba(86,152,255,0.3)',
          pointHoverBorderWidth: 4,
          borderColor: '#5698FF',
          borderWidth: 2,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            if (!context.chart.chartArea) return 'transparent';
            const { ctx, chartArea: { top, bottom } } = context.chart;
            const gradient = ctx.createLinearGradient(0, top, 0, bottom);
            gradient.addColorStop(0, 'rgba(86,152,255,0.35)');
            gradient.addColorStop(0.55, 'rgba(86,152,255,0.08)');
            gradient.addColorStop(1, 'rgba(86,152,255,0)');
            return gradient;
          },
        },
      ],
    }),
    [labels, series, label],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      fill: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 12, bottom: 8, left: 0, right: 4 } },
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          display: false,
          min: yBounds.min,
          max: yBounds.max,
        },
        x: {
          type: 'category',
          display: true,
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: 'rgba(235,236,236,0.35)',
            font: { size: 11, family: 'DM Sans' },
            maxRotation: 0,
          },
        },
      },
      plugins: TOOLTIP,
    }),
    [yBounds.min, yBounds.max],
  );

  const canvasRef = useChart({ type: 'line', data, options });

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} width={350} height={250} />
    </div>
  );
};

export default AreaChart;
