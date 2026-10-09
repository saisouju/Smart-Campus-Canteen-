import type { ReactNode } from 'react';

export interface ChartTooltipProps {
  title: ReactNode;
  rows: { label: string; value: ReactNode; swatch?: string }[];
}

/** Tooltip body rendered inside Recharts' <Tooltip content>. */
export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-ink">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-4 text-ink-muted">
          <span className="flex items-center gap-1.5">
            {r.swatch && <span className="inline-block size-2.5 rounded-sm" style={{ background: r.swatch }} />}
            {r.label}
          </span>
          <span className="font-semibold text-ink tabular-nums">{r.value}</span>
        </p>
      ))}
    </div>
  );
}
