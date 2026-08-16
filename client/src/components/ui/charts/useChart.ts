import { useEffect, useRef } from 'react';
import type {
  Chart as ChartJS,
  ChartConfiguration,
  ChartData,
  ChartOptions,
  ChartType,
  Plugin,
} from 'chart.js';
import { Chart } from 'chart.js';
import { ensureChartJsRegistered } from '@/components/ui/charts/chartSetup';

type UseChartArgs<T extends ChartType> = {
  type: T;
  data: ChartData<T>;
  options: ChartOptions<T>;
  plugins?: Plugin<T>[];
};

export const useChart = <T extends ChartType>({
  type,
  data,
  options,
  plugins,
}: UseChartArgs<T>) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS<T> | null>(null);

  useEffect(() => {
    ensureChartJsRegistered();
    const canvas = canvasRef.current;
    if (!canvas || chartRef.current) return undefined;

    chartRef.current = new Chart(canvas, {
      type,
      data,
      options,
      plugins,
    } as ChartConfiguration<T>);

    return () => {
      const chart = chartRef.current;
      if (!chart) return;
      chart.stop();
      chart.destroy();
      chartRef.current = null;
    };
    // Mount once — data/options sync below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data = data;
    chart.options = options;
    chart.update('none');
  }, [data, options]);

  return canvasRef;
};
