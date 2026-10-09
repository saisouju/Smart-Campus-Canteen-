const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export const formatCurrency = (amount: number) => inr.format(amount);

/** Compact axis label: ₹6.1k */
export const formatCurrencyCompact = (amount: number) =>
  amount >= 1000 ? `₹${(amount / 1000).toFixed(amount >= 10_000 ? 0 : 1)}k` : `₹${amount}`;

/** "2026-10-07 17:31:00" (server local time) → "5:31 PM" */
export function formatClock(sqlDateTime: string): string {
  const [, time = ''] = sqlDateTime.split(' ');
  const [h = 0, m = 0] = time.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const HONORIFICS = /^(dr|prof|mr|mrs|ms|mx)\.?$/i;

/** First given name, ignoring titles: "Dr. Meera Iyer" → "Meera". */
export const firstName = (fullName: string) =>
  fullName.split(/\s+/).find((part) => !HONORIFICS.test(part)) ?? fullName;

export const pluralize = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
