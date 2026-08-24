import { useCallback, useMemo, useRef, useState } from 'react';
import type { Chart, ChartOptions, ScriptableContext, TooltipModel } from 'chart.js';
import {
  countChartYBounds,
  countLineTension,
} from '@/components/ui/charts/scaleUtils';
import { useChart } from '@/components/ui/charts/useChart';

export type AreaChartSeries = {
  label: string;
  values: number[];
  color: string;
};

type AreaChartProps = {
  labels?: string[];
  values?: number[];
  label?: string;
  extraSeries?: AreaChartSeries[];
};

const FALLBACK_SERIES = [0, 0, 0, 0, 0, 0, 0];
const PRIMARY_COLOR = '#5698FF';

type TooltipRow = { label: string; value: number; color: string };
type TooltipState = { visible: boolean; left: number; top: number; title: string; rows: TooltipRow[] };

const hexToRgba = (hex: string, alpha: number): string => {
  const raw = hex.replace('#', '');
  const n = parseInt(raw.length === 3 ? raw.replace(/(.)/g, '$1$1') : raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const AreaChart = ({
  labels = [],
  values = [],
  label = 'New users',
  extraSeries = [],
}: AreaChartProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const seriesList = useMemo<AreaChartSeries[]>(() => {
    const primary: AreaChartSeries[] =
      values.length > 0
        ? [{ label, values, color: PRIMARY_COLOR }]
        : extraSeries.length === 0
          ? [{ label, values: FALLBACK_SERIES, color: PRIMARY_COLOR }]
          : [];
    return [...primary, ...extraSeries];
  }, [label, values, extraSeries]);

  const yBounds = useMemo(() => {
    const flat = seriesList.flatMap((s) => s.values);
    return countChartYBounds(flat.length > 0 ? flat : FALLBACK_SERIES);
  }, [seriesList]);

  const applyTooltip = useCallback(
    (_chart: Chart, tooltip: TooltipModel<'line'>) => {
      if (tooltip.opacity === 0 || tooltip.dataPoints.length === 0) {
        setTip((prev) => (prev?.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const rows: TooltipRow[] = tooltip.dataPoints.map((point) => ({
        label: point.dataset.label ?? '',
        value: typeof point.parsed.y === 'number' ? point.parsed.y : 0,
        color: String(point.dataset.borderColor ?? PRIMARY_COLOR),
      }));

      const wrapWidth = wrapRef.current?.clientWidth ?? 0;
      const pad = 88;
      const left =
        wrapWidth > pad * 2
          ? Math.min(Math.max(tooltip.caretX, pad), wrapWidth - pad)
          : tooltip.caretX;

      const next: TooltipState = {
        visible: true,
        left,
        top: tooltip.caretY,
        title: tooltip.title[0] ?? '',
        rows,
      };

      setTip((prev) => {
        if (
          prev &&
          prev.visible === next.visible &&
          prev.left === next.left &&
          prev.top === next.top &&
          prev.title === next.title &&
          prev.rows.length === next.rows.length &&
          prev.rows.every((row, i) => row.label === next.rows[i]?.label && row.value === next.rows[i]?.value)
        ) {
          return prev;
        }
        return next;
      });
    },
    [],
  );

  const data = useMemo(
    () => ({
      labels: labels.length > 0 ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: seriesList.map((s) => ({
        label: s.label,
        data: s.values,
        tension: countLineTension(s.values),
        cubicInterpolationMode: 'monotone' as const,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: s.color,
        pointHoverBorderColor: hexToRgba(s.color, 0.35),
        pointHoverBorderWidth: 6,
        borderColor: s.color,
        borderWidth: 2,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          if (!context.chart.chartArea) return 'transparent';
          const { ctx, chartArea: { top, bottom } } = context.chart;
          const gradient = ctx.createLinearGradient(0, top, 0, bottom);
          gradient.addColorStop(0, hexToRgba(s.color, 0.28));
          gradient.addColorStop(0.6, hexToRgba(s.color, 0.06));
          gradient.addColorStop(1, hexToRgba(s.color, 0));
          return gradient;
        },
      })),
    }),
    [labels, seriesList],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      fill: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 12, bottom: 8, left: 0, right: 4 } },
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { display: false, min: yBounds.min, max: yBounds.max },
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
          enabled: false,
          mode: 'index',
          intersect: false,
          external: ({ chart, tooltip }) => applyTooltip(chart, tooltip),
        },
      },
    }),
    [yBounds.min, yBounds.max, applyTooltip],
  );

  const canvasRef = useChart({ type: 'line', data, options });

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas ref={canvasRef} width={350} height={250} />
      {tip && (
        <div
          className={`chart-tip${tip.visible ? ' is-on' : ''}`}
          style={{ left: tip.left, top: tip.top }}
          role="tooltip"
        >
          <p className="chart-tip__day">{tip.title}</p>
          <ul className="chart-tip__rows">
            {tip.rows.map((row) => (
              <li key={row.label} className="chart-tip__row">
                <span className="chart-tip__swatch" style={{ backgroundColor: row.color }} aria-hidden />
                <span className="chart-tip__name">{row.label}</span>
                <span className="chart-tip__val">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AreaChart;
