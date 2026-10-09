import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { timeSlots } from '@/mocks/fixtures';
import { TimeSlotSelect } from './TimeSlotSelect';

const meta = {
  title: 'Customer/TimeSlotSelect',
  component: TimeSlotSelect,
  args: { slots: timeSlots, value: '', onChange: fn() },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof TimeSlotSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <TimeSlotSelect {...args} value={value} onChange={setValue} />;
  },
};
export const Loading: Story = { args: { slots: [], loading: true } };
export const NoSlotsLeft: Story = { args: { slots: [] } };
export const WithError: Story = { args: { error: 'That pickup slot is fully booked' } };
