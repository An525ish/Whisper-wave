import { useEffect, useMemo, useRef } from 'react';
import {
  Chart,
  Interaction,
  registerables,
  type ScriptableContext,
} from 'chart.js';
import { CrosshairPlugin, Interpolate } from 'chartjs-plugin-crosshair';

Chart.register(CrosshairPlugin, ...registerables);
(Interaction.modes as unknown as Record<string, unknown>).interpolate =
  Interpolate;

type SingleAreaChartProps = {
  labels?: string[];
  values?: number[];
  label?: string;
};

const SingleAreaChart = ({
  labels = [],
  values = [],
  label = 'Messages',
}: SingleAreaChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const chartDataConfig = useMemo(
    () => ({
      labels:
        labels.length > 0
          ? labels
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label,
          data: values.length > 0 ? values : [0, 0, 0, 0, 0, 0, 0],
          pointRadius: 0,
          borderColor: '#5698FF',
          borderWidth: 2,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const bgColor = [
              'rgba(30, 41, 67, 0.5)',
              'rgba(30, 41, 67, 0)',
            ];
            if (!context.chart.chartArea) return;
            const {
              ctx,
              chartArea: { top, bottom },
            } = context.chart;
            const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
            gradientBg.addColorStop(0, bgColor[0]);
            gradientBg.addColorStop(0.5, bgColor[0]);
            gradientBg.addColorStop(1, bgColor[1]);
            return gradientBg;
          },
        },
      ],
    }),
    [labels, values, label],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const chart = new Chart(canvas, {
      type: 'line',
      data: chartDataConfig,
      options: {
        responsive: true,
        fill: true,
        maintainAspectRatio: false,
        scales: {
          y: { display: false },
          x: { display: false },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'interpolate' as unknown as 'nearest',
            intersect: false,
          },
          crosshair: {
            line: { color: '#5698FF', width: 1 },
            sync: { enabled: false },
          },
        },
      } as import('chart.js').ChartOptions<'line'>,
    });

    return () => chart.destroy();
  }, [chartDataConfig]);

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} width={350} height={120}></canvas>
    </div>
  );
};

export default SingleAreaChart;
