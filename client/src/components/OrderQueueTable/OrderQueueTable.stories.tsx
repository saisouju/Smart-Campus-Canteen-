import type { Meta, StoryObj } from '@storybook/react-vite';
import Paper from '@mui/material/Paper';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { nextOrderStatus } from '@canteen/shared';
import { queue } from '@/mocks/fixtures';
import { OrderQueueTable } from './OrderQueueTable';

const meta = {
  title: 'Admin/OrderQueueTable',
  component: OrderQueueTable,
  args: { orders: queue, onAdvance: fn() },
  decorators: [(Story) => <Paper variant="outlined">{Story()}</Paper>],
} satisfies Meta<typeof OrderQueueTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { orders: [] } };
export const Updating: Story = { args: { pendingIds: new Set(['ORD-C3']) } };

/** Click the action buttons to walk orders through the lifecycle. */
export const Interactive: Story = {
  render: function Render(args) {
    const [orders, setOrders] = useState(args.orders);
    return (
      <OrderQueueTable
        {...args}
        orders={orders}
        onAdvance={(id) =>
          setOrders((list) => list.map((o) => (o.id === id ? { ...o, status: nextOrderStatus(o.status) ?? o.status } : o)))
        }
      />
    );
  },
};
