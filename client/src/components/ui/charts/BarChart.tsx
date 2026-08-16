import { useMemo } from 'react';
import type { ChartOptions, ScriptableContext } from 'chart.js';
import {
  countChartYBounds,
  countYTickStep,
} from '@/components/ui/charts/scaleUtils';
import { useChart } from '@/components/ui/charts/useChart';

type BarChartProps = {
  labels?: string[];
  values?: number[];
  label?: string;
};

const BarChart = ({ labels = [], values = [], label = 'Messages' }: BarChartProps) => {
  const series = values.length > 0 ? values : [0, 0, 0, 0, 0, 0, 0];
  const yBounds = countChartYBounds(series);

  const data = useMemo(
    () => ({
      labels: labels.length > 0 ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label,
          data: series,
          borderColor: '#5698FF',
          borderWidth: 0,
          backgroundColor: (context: ScriptableContext<'bar'>) => {
            if (!context.chart.chartArea) return 'rgba(86,152,255,0.7)';
            const { ctx, chartArea: { top, bottom } } = context.chart;
            const gradient = ctx.createLinearGradient(0, top, 0, bottom);
            gradient.addColorStop(0, 'rgba(86,152,255,0.85)');
            gradient.addColorStop(1, 'rgba(86,152,255,0.25)');
            return gradient;
          },
          hoverBackgroundColor: 'rgba(86,152,255,0.95)',
          categoryPercentage: 0.5,
          barPercentage: 0.85,
          borderRadius: 6,
          borderSkipped: false,
          minBarLength: 3,
        },
      ],
    }),
    [labels, series, label],
  );

  const options = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          display: true,
          min: yBounds.min,
          max: yBounds.max,
          beginAtZero: true,
          grid: { color: 'rgba(235,236,236,0.05)' },
          border: { display: false },
          ticks: {
            color: 'rgba(235,236,236,0.35)',
            font: { size: 11, family: 'DM Sans' },
            stepSize: countYTickStep(yBounds.max),
            precision: 0,
          },
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
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgb(42 33 54)',
          borderColor: 'rgb(53 47 61)',
          borderWidth: 1,
          titleColor: 'rgba(235,236,236,0.45)',
          bodyColor: '#ebecec',
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
        },
      },
    }),
    [yBounds.min, yBounds.max],
  );

  const canvasRef = useChart({ type: 'bar', data, options });

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} width={350} height={250} />
    </div>
  );
};

export default BarChart;
