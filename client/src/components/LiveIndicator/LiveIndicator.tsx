export type LiveIndicatorState = 'connecting' | 'live' | 'polling';

const COPY: Record<LiveIndicatorState, { label: string; dot: string }> = {
  live: { label: 'Live', dot: 'bg-emerald-500' },
  connecting: { label: 'Connecting…', dot: 'bg-amber-500' },
  polling: { label: 'Auto-refresh', dot: 'bg-sky-500' },
};

/** Small "● Live" badge showing whether real-time updates are flowing. */
export function LiveIndicator({ state }: { state: LiveIndicatorState }) {
  const { label, dot } = COPY[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted" role="status">
      <span className="relative flex size-2">
        {state === 'live' && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${dot}`} />}
        <span className={`relative inline-flex size-2 rounded-full ${dot}`} />
      </span>
      {label}
    </span>
  );
}
