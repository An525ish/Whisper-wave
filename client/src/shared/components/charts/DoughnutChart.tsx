import { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import type { Chart as ChartJS, Plugin, ChartOptions } from 'chart.js';

const COLORS = [
  '#8A56E2',
  '#E256AE',
  '#56E2CF',
  '#01C36D',
  '#5668E2',
  '#E25668',
];

type AllocationChartProps = {
  labels?: string[];
  values?: number[];
};

const AllocationChart = ({
  labels = ['Users', 'Groups', 'Chats', 'Messages'],
  values = [0, 0, 0, 0],
}: AllocationChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  const doughnutLabel = useMemo<Plugin<'doughnut'>>(
    () => ({
      id: 'doughnutText',
      afterDatasetsDraw: (chart: ChartJS<'doughnut'>) => {
        const { ctx, data } = chart;
        const activeElements = chart.getActiveElements();
        const { width, height } = chart.chartArea;
        ctx.save();

        if (activeElements?.length) {
          const x = width / 2;
          const y = height / 2;
          const active = activeElements[0];
          const dataLabel = data.labels?.[active.index];
          const dataPoint =
            data.datasets[active.datasetIndex].data[active.index];
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
    }),
    [],
  );

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
            color: '#fff',
            padding: 15,
          },
        },
        tooltip: { enabled: false },
      },
    }),
    [],
  );

  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return undefined;

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data,
      options,
      plugins: [doughnutLabel],
    });

    return () => chart.destroy();
  }, [data, options, doughnutLabel]);

  return (
    <div className="mt-4">
      <canvas
        ref={chartRef}
        width={180}
        height={230}
        style={{ padding: '.6rem' }}
      ></canvas>
    </div>
  );
};

export default AllocationChart;
