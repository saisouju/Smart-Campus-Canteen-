import type { Meta, StoryObj } from '@storybook/react-vite';
import Paper from '@mui/material/Paper';
import { topCustomers } from '@/mocks/fixtures';
import { TopCustomersTable } from './TopCustomersTable';

const meta = {
  title: 'Admin/TopCustomersTable',
  component: TopCustomersTable,
  args: { customers: topCustomers },
  decorators: [(Story) => <Paper variant="outlined" className="max-w-4xl">{Story()}</Paper>],
} satisfies Meta<typeof TopCustomersTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopTen: Story = {};
export const TopFive: Story = { args: { customers: topCustomers.slice(0, 5) } };
export const Empty: Story = { args: { customers: [] } };
