import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { menuById } from '@/mocks/fixtures';
import { OrderConfirmationDialog } from './OrderConfirmationDialog';

const lines = [
  { item: menuById['veg-thali']!, quantity: 1 },
  { item: menuById['cold-coffee']!, quantity: 2 },
];

const meta = {
  title: 'Customer/OrderConfirmationDialog',
  component: OrderConfirmationDialog,
  args: {
    open: true,
    lines,
    total: 220,
    slotLabel: '12:30 PM - 1:00 PM',
    customerName: 'Aarav Sharma',
    onConfirm: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof OrderConfirmationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Review: Story = {};
export const Placing: Story = { args: { placing: true } };
export const Failed: Story = { args: { error: 'Veg Thali is sold out' } };
