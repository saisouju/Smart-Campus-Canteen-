const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" in server local time (matches SQLite's 'localtime' modifier). */
export function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD HH:MM:SS" in server local time, the format stored in orders.created_at. */
export function toLocalDateTime(d: Date): string {
  return `${toLocalDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Monday 00:00 of the week containing `d` (ISO weeks, Mon–Sun). */
export function startOfWeek(d: Date): Date {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (monday.getDay() + 6) % 7; // Sun=0 → 6, Mon=1 → 0
  monday.setDate(monday.getDate() - offset);
  return monday;
}

export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
