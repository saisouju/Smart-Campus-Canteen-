import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { menuById, timeSlots } from '@/mocks/fixtures';
import { TimeSlotSelect } from '../TimeSlotSelect/TimeSlotSelect';
import { CartSummary } from './CartSummary';

const lines = [
  { item: menuById['chicken-biryani']!, quantity: 1 },
  { item: menuById['samosa']!, quantity: 2 },
  { item: menuById['masala-chai']!, quantity: 3 },
];
const total = lines.reduce((s, l) => s + l.item.price * l.quantity, 0);

const meta = {
  title: 'Customer/CartSummary',
  component: CartSummary,
  args: { lines, total, onQuantityChange: fn(), onClear: fn() },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof CartSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithItems: Story = {};
export const Empty: Story = { args: { lines: [], total: 0 } };

/** Cart + time slot + checkout button, composed exactly like the student dashboard. */
export const WithCheckout: Story = {
  render: function Render(args) {
    const [slot, setSlot] = useState('');
    return (
      <CartSummary
        {...args}
        footer={
          <div className="flex flex-col gap-3">
            <TimeSlotSelect slots={timeSlots} value={slot} onChange={setSlot} />
            <Button variant="contained" size="large" disabled={!slot}>
              Review order
            </Button>
          </div>
        }
      />
    );
  },
};
