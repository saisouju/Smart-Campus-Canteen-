import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyEarning } from '@canteen/shared';
import { formatCurrency, formatCurrencyCompact, pluralize } from '@/utils/format';
import { ChartCard } from '../ChartCard/ChartCard';
import { ChartTooltip } from './ChartTooltip';
import { axisTick, useChartTokens } from './chartTokens';

export interface WeeklyEarningsChartProps {
  data: DailyEarning[];
  height?: number;
}

/**
 * Single-series column chart of revenue per day (Mon–Sun).
 * Order counts live in the tooltip/table rather than on a second y-axis.
 */
export function WeeklyEarningsChart({ data, height = 280 }: WeeklyEarningsChartProps) {
  const t = useChartTokens();
  const peak = Math.max(0, ...data.map((d) => d.earnings));
  const total = data.reduce((s, d) => s + d.earnings, 0);

  return (
    <ChartCard
      title="Weekly earnings"
      subtitle={`${formatCurrency(total)} this week · peak day labelled`}
      table={{
        columns: ['Day', 'Date', 'Orders', 'Earnings'],
        rows: data.map((d) => [d.day, d.date, d.orders, formatCurrency(d.earnings)]),
        numeric: [2, 3],
      }}
    >
      <div style={{ height }} role="img" aria-label={`Earnings per day this week, total ${formatCurrency(total)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={t.grid} />
            <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: t.grid }} tick={axisTick(t.textSecondary)} />
            <YAxis
              width={52}
              tickLine={false}
              axisLine={false}
              tick={axisTick(t.textSecondary)}
              tickFormatter={formatCurrencyCompact}
            />
            <Tooltip
              cursor={{ fill: t.cursor }}
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as DailyEarning | undefined;
                if (!active || !d) return null;
                return (
                  <ChartTooltip
                    title={`${d.day}, ${d.date}`}
                    rows={[
                      { label: 'Earnings', value: formatCurrency(d.earnings), swatch: t.seriesPrimary },
                      { label: 'Orders', value: pluralize(d.orders, 'order') },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="earnings" name="Earnings" fill={t.seriesPrimary} radius={[4, 4, 0, 0]} maxBarSize={28}>
              {/* Direct-label only the peak day; the axis and tooltip carry the rest. */}
              <LabelList
                dataKey="earnings"
                position="top"
                content={({ x, y, width, value }) =>
                  Number(value) === peak && peak > 0 ? (
                    <text
                      x={Number(x) + Number(width) / 2}
                      y={Number(y) - 8}
                      textAnchor="middle"
                      fill={t.textPrimary}
                      fontSize={12}
                      fontWeight={600}
                    >
                      {formatCurrencyCompact(Number(value))}
                    </text>
                  ) : null
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
