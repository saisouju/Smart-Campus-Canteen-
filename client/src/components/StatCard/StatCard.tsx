import type { SvgIconComponent } from '@mui/icons-material';
import Paper from '@mui/material/Paper';

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: SvgIconComponent;
}

/** Headline KPI tile. Numbers stay in the body sans (not the display face) per the data-viz spec. */
export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Paper variant="outlined" className="flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
      {Icon && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Icon fontSize="small" />
        </span>
      )}
    </Paper>
  );
}
