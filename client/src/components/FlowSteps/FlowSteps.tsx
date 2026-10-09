const STEPS = ['Pick food', 'Choose slot', 'Confirm', 'Track'] as const;

/** Compact breadcrumb of the ordering flow; `active` is 1-based. */
export function FlowSteps({ active }: { active: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold" aria-label="Ordering steps">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < active ? 'done' : n === active ? 'current' : 'todo';
        return (
          <li key={label} className="flex items-center gap-2" aria-current={state === 'current' ? 'step' : undefined}>
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
                state === 'current'
                  ? 'bg-brand text-white dark:text-stone-900'
                  : state === 'done'
                    ? 'bg-brand-soft text-brand'
                    : 'bg-line/60 text-ink-muted'
              }`}
            >
              <span className="tabular-nums">{n}</span> {label}
            </span>
            {n < STEPS.length && <span className="text-ink-muted" aria-hidden>➔</span>}
          </li>
        );
      })}
    </ol>
  );
}
