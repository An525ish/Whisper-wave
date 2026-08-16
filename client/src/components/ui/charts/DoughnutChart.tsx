import { useMemo } from 'react';
import type { Chart as ChartJS, ChartOptions, Plugin } from 'chart.js';
import { useChart } from '@/components/ui/charts/useChart';

const COLORS = [
  '#5698FF',  // blue
  '#01C36D',  // green
  '#ECC347',  // yellow
  '#FF5863',  // red
  '#D4AA5A',  // gold
  '#8A56E2',  // purple
];

type AllocationChartProps = {
  labels?: string[];
  values?: number[];
};

const doughnutLabel = {
  id: 'doughnutText',
  afterDatasetsDraw: (chart: ChartJS<'doughnut'>) => {
    const { ctx, data, chartArea } = chart;
    if (!chartArea) return;

    const activeElements = chart.getActiveElements();
    const { width, height } = chartArea;
    ctx.save();

    if (activeElements?.length) {
      const x = width / 2;
      const y = height / 2;
      const active = activeElements[0];
      const dataLabel = data.labels?.[active.index];
      const dataPoint = data.datasets[active.datasetIndex].data[active.index];
      const backgroundColor = data.datasets[active.datasetIndex]
        .backgroundColor as string[];

      ctx.font = 'normal 14px DM Sans';
      ctx.fillStyle = backgroundColor[active.index];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${dataLabel}: ${dataPoint}`, x, y);
    }
    ctx.restore();
  },
} satisfies Plugin<'doughnut'>;

const AllocationChart = ({
  labels = ['Users', 'Groups', 'Chats', 'Messages'],
  values = [0, 0, 0, 0],
}: AllocationChartProps) => {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: COLORS.slice(0, labels.length),
          hoverBorderColor: COLORS.slice(0, labels.length),
          hoverBackgroundColor: COLORS.slice(0, labels.length),
          borderWidth: 0,
          hoverBorderWidth: 5,
        },
      ],
    }),
    [labels, values],
  );

  const options = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: 80,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            color: 'rgba(235,236,236,0.6)',
            padding: 14,
            font: { size: 11, family: 'DM Sans' },
          },
        },
        tooltip: { enabled: false },
      },
    }),
    [],
  );

  const canvasRef = useChart({
    type: 'doughnut',
    data,
    options,
    plugins: [doughnutLabel],
  });

  return (
    <div className="mt-4">
      <canvas
        ref={canvasRef}
        width={180}
        height={230}
        style={{ padding: '.6rem' }}
      />
    </div>
  );
};

export default AllocationChart;
