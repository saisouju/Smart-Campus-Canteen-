import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import './IntroSequence.css';

/** Total timeline length; keep in sync with the 7.6s keyframes in IntroSequence.css. */
export const INTRO_DURATION_MS = 7600;
/** Reduced-motion variant: a still title card that fades in and out. */
export const CALM_DURATION_MS = 2400;
const EXIT_MS = 700;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Splits text into per-letter spans whose stagger is driven by --i. */
function KineticText({ text, t0, t1, stay }: { text: string; t0: number; t1?: number; stay?: boolean }) {
  return (
    <span className="cine-word" aria-hidden>
      {[...text].map((ch, i) => (
        <span
          key={i}
          className={stay ? 'cine-letter cine-letter--stay' : 'cine-letter'}
          style={{ '--i': i, '--t0': `${t0}ms`, '--t1': `${t1 ?? 0}ms` } as Vars}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

const LINES = [
  { text: 'Order ahead.', t0: 2450, accent: false },
  { text: 'Skip the queue.', t0: 2850, accent: true },
  { text: 'Pick up hot.', t0: 3250, accent: false },
];

/** Deterministic "confetti" so renders are stable. */
const DOTS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 61 + 13) % 100}%`,
  size: 6 + ((i * 7) % 12),
  dx: `${((i % 2 ? 1 : -1) * (20 + ((i * 13) % 40)))}vmin`,
  dy: `${-10 - ((i * 17) % 30)}vmin`,
  t0: `${(i * 90) % 1200}ms`,
}));

export interface IntroSequenceProps {
  /** Called once the exit transition has finished (or immediately under reduced motion). */
  onFinish: () => void;
  /** Storybook aid: freeze the timeline. */
  paused?: boolean;
  /** Force the reduced-motion title card (defaults to the OS setting). */
  calm?: boolean;
}

/**
 * Full-screen cinematic opener: kinetic typography, a continuously morphing
 * shape, iris wipes between scenes and a single moving camera.
 * Skippable (button or Esc). With prefers-reduced-motion it shows a short,
 * motion-free title card instead.
 */
export function IntroSequence({ onFinish, paused = false, calm: calmProp }: IntroSequenceProps) {
  const [calm] = useState(() => calmProp ?? prefersReducedMotion());
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinishRef.current();
  }, []);

  const skip = useCallback(() => {
    setLeaving(true);
    window.setTimeout(finish, EXIT_MS);
  }, [finish]);

  useEffect(() => {
    if (paused) return;
    const duration = calm ? CALM_DURATION_MS : INTRO_DURATION_MS;
    const leaveTimer = window.setTimeout(() => setLeaving(true), duration - EXIT_MS);
    const doneTimer = window.setTimeout(finish, duration);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && skip();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish, skip, paused, calm]);

  if (calm) {
    return (
      <div className={`cine-root cine-calm ${leaving ? 'is-fading' : ''}`} role="dialog" aria-modal="true" aria-label="Campus Canteen. Fresh, fast, on time.">
        <div className="cine-calm-card">
          <img src="/favicon.svg" alt="" className="cine-calm-logo" />
          <p className="cine-calm-title">Campus Canteen</p>
          <p className="cine-calm-tagline">Fresh · Fast · On time</p>
        </div>
        <button type="button" className="cine-skip" onClick={skip}>
          Skip intro ⏭
        </button>
      </div>
    );
  }

  return (
    <div
      className={`cine-root ${leaving ? 'is-leaving' : ''}`}
      data-paused={paused}
      role="dialog"
      aria-modal="true"
      aria-label="Campus Canteen intro. Order ahead, skip the queue, pick up hot."
    >
      <div className="cine-stage">
        <div className="cine-camera">
          {DOTS.map((d, i) => (
            <span
              key={i}
              className="cine-dot"
              style={{ left: d.left, top: d.top, width: d.size, height: d.size, '--dx': d.dx, '--dy': d.dy, '--t0': d.t0 } as Vars}
            />
          ))}

          <div className="cine-wipe cine-wipe--1" />
          <div className="cine-wipe cine-wipe--2" />
          <div className="cine-shape" />

          {/* Scene 1 */}
          <div className="cine-scene">
            <span className="cine-hungry">
              <KineticText text="HUNGRY?" t0={250} t1={1750} />
            </span>
          </div>

          {/* Scene 2 */}
          <div className="cine-scene cine-scene--2">
            <div className="cine-lines" aria-hidden>
              {LINES.map((l) => (
                <span key={l.text} className={`cine-line ${l.accent ? 'cine-line--accent' : ''}`}>
                  <span style={{ '--t0': `${l.t0}ms`, '--t1': `${4050 + (l.t0 - 2450) / 4}ms` } as Vars}>{l.text}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Scene 3 — the morph shape becomes the bowl under this steam */}
          <div className="cine-scene">
            <div className="cine-logo" aria-hidden>
              <svg className="cine-steam" viewBox="0 0 66 48">
                {[12, 33, 54].map((x, i) => (
                  <path
                    key={x}
                    d={`M${x} 46 c-8 -8 8 -14 0 -22 c-8 -8 8 -14 0 -22`}
                    pathLength={60}
                    style={{ '--i': i } as Vars}
                  />
                ))}
              </svg>
              <div className="cine-title">
                <KineticText text="Campus Canteen" t0={5300} stay />
              </div>
              <p className="cine-tagline">Fresh · Fast · On time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cine-progress" />
      <button type="button" className="cine-skip" onClick={skip}>
        Skip intro ⏭
      </button>
    </div>
  );
}
