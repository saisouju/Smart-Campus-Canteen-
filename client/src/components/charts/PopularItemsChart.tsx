import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PopularItem } from '@canteen/shared';
import { formatCurrency } from '@/utils/format';
import { ChartCard } from '../ChartCard/ChartCard';
import { ChartTooltip } from './ChartTooltip';
import { axisTick, useChartTokens } from './chartTokens';

export interface PopularItemsChartProps {
  data: PopularItem[];
  height?: number;
}

/** Horizontal bars ranking the week's best sellers by units sold. */
export function PopularItemsChart({ data, height = 280 }: PopularItemsChartProps) {
  const t = useChartTokens();

  return (
    <ChartCard
      title="Popular items"
      subtitle="Top sellers this week, by units sold"
      table={{
        columns: ['Item', 'Category', 'Units', 'Revenue'],
        rows: data.map((d) => [d.name, d.category, d.quantity, formatCurrency(d.revenue)]),
        numeric: [2, 3],
      }}
    >
      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-muted">No sales recorded this week yet.</p>
      ) : (
        <div style={{ height }} role="img" aria-label={`Top ${data.length} items by units sold`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} stroke={t.grid} />
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tickLine={false}
                axisLine={false}
                tick={axisTick(t.textPrimary)}
              />
              <Tooltip
                cursor={{ fill: t.cursor }}
                content={({ active, payload }) => {
                  const d = payload?.[0]?.payload as PopularItem | undefined;
                  if (!active || !d) return null;
                  return (
                    <ChartTooltip
                      title={d.name}
                      rows={[
                        { label: 'Units sold', value: d.quantity, swatch: t.seriesSecondary },
                        { label: 'Revenue', value: formatCurrency(d.revenue) },
                        { label: 'Category', value: d.category },
                      ]}
                    />
                  );
                }}
              />
              <Bar dataKey="quantity" name="Units sold" fill={t.seriesSecondary} radius={[0, 4, 4, 0]} maxBarSize={22}>
                <LabelList dataKey="quantity" position="right" fill={t.textSecondary} fontSize={12} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
