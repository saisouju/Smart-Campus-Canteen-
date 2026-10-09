import CurrencyRupeeRounded from '@mui/icons-material/CurrencyRupeeRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatCard } from './StatCard';

const meta = {
  title: 'Admin/StatCard',
  component: StatCard,
  args: { label: 'Revenue this week', value: '₹13,630', hint: 'Mon 5 – Sun 11 Oct', icon: CurrencyRupeeRounded },
  decorators: [(Story) => <div className="max-w-xs">{Story()}</div>],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Revenue: Story = {};
export const Orders: Story = { args: { label: 'Orders this week', value: '74', hint: undefined, icon: ReceiptLongRounded } };
export const NoIcon: Story = { args: { icon: undefined } };
