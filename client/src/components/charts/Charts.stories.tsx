import type { Meta, StoryObj } from '@storybook/react-vite';
import { analytics } from '@/mocks/fixtures';
import { PopularItemsChart } from './PopularItemsChart';
import { WeeklyEarningsChart } from './WeeklyEarningsChart';

const meta = {
  title: 'Admin/Charts',
  component: WeeklyEarningsChart,
  args: { data: analytics.weeklyEarnings },
  decorators: [(Story) => <div className="max-w-3xl">{Story()}</div>],
} satisfies Meta<typeof WeeklyEarningsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WeeklyEarnings: Story = {};

export const WeeklyEarningsEmptyWeek: Story = {
  args: { data: analytics.weeklyEarnings.map((d) => ({ ...d, earnings: 0, orders: 0 })) },
};

export const PopularItems: Story = {
  render: () => <PopularItemsChart data={analytics.popularItems} />,
};

export const PopularItemsEmpty: Story = {
  render: () => <PopularItemsChart data={[]} />,
};
