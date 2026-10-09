import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { ORDER_STATUSES, type OrderStatus } from '@canteen/shared';
import { sampleOrder } from '@/mocks/fixtures';
import { OrderTracker } from './OrderTracker';

const meta = {
  title: 'Customer/OrderTracker',
  component: OrderTracker,
  args: { order: sampleOrder, live: 'live' },
  argTypes: {
    live: { control: 'inline-radio', options: ['connecting', 'live', 'polling'] },
  },
} satisfies Meta<typeof OrderTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

const withStatus = (status: OrderStatus): Story => ({ args: { order: { ...sampleOrder, status } } });

export const Placed = withStatus('placed');
export const Preparing = withStatus('preparing');
export const ReadyForPickup = withStatus('ready');
export const Completed = withStatus('completed');

/** Cycles through the lifecycle every 2s, as the SSE stream would. */
export const LiveProgression: Story = {
  render: function Render(args) {
    const [i, setI] = useState(0);
    useEffect(() => {
      const t = setInterval(() => setI((n) => (n + 1) % ORDER_STATUSES.length), 2000);
      return () => clearInterval(t);
    }, []);
    return <OrderTracker {...args} order={{ ...args.order, status: ORDER_STATUSES[i]! }} />;
  },
};
