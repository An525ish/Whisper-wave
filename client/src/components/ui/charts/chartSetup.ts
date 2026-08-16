import { Chart, registerables } from 'chart.js';

let registered = false;

export const ensureChartJsRegistered = (): void => {
  if (registered) return;
  Chart.register(...registerables);
  registered = true;
};
