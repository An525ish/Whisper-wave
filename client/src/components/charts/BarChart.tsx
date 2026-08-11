import { useEffect, useMemo, useRef } from 'react';
import { Chart, Interaction, registerables } from 'chart.js';
import { CrosshairPlugin, Interpolate } from 'chartjs-plugin-crosshair';

Chart.register(CrosshairPlugin, ...registerables);
(Interaction.modes as unknown as Record<string, unknown>).interpolate =
  Interpolate;

type BarChartProps = {
  labels?: string[];
  values?: number[];
  label?: string;
};

const BarChart = ({
  labels = [],
  values = [],
  label = 'Messages',
}: BarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const data = useMemo(
    () => ({
      labels:
        labels.length > 0
          ? labels
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label,
          data: values.length > 0 ? values : [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#5698FF',
          borderWidth: 2,
          backgroundColor: 'rgba(30, 41, 67)',
          categoryPercentage: 0.3,
          borderRadius: Number.MAX_VALUE,
        },
      ],
    }),
    [labels, values, label],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const chart = new Chart(canvas, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        fill: true,
        maintainAspectRatio: false,
        scales: {
          y: { display: true, grid: { display: false } },
          x: { display: true, grid: { display: false } },
        },
        plugins: {
          tooltip: {
            mode: 'interpolate' as unknown as 'nearest',
            intersect: false,
          },
          crosshair: {
            line: { color: '#5698FF', width: 1 },
            sync: { enabled: false },
          },
          legend: { display: false },
        },
      } as import('chart.js').ChartOptions<'bar'>,
    });

    return () => chart.destroy();
  }, [data]);

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} width={350} height={250}></canvas>
    </div>
  );
};

export default BarChart;
