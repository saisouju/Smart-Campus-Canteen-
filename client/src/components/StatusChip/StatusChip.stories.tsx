import type { Meta, StoryObj } from '@storybook/react-vite';
import { ORDER_STATUSES } from '@canteen/shared';
import { LiveIndicator } from '../LiveIndicator/LiveIndicator';
import { QuantityStepper } from '../QuantityStepper/QuantityStepper';
import { StatusChip } from './StatusChip';

const meta = {
  title: 'Shared/StatusChip',
  component: StatusChip,
  args: { status: 'preparing' },
  argTypes: { status: { control: 'inline-radio', options: ORDER_STATUSES } },
} satisfies Meta<typeof StatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {ORDER_STATUSES.map((s) => (
        <StatusChip key={s} status={s} size="medium" />
      ))}
    </div>
  ),
};

/** Other small shared primitives, shown together for reference. */
export const Primitives: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex gap-6">
        <LiveIndicator state="live" />
        <LiveIndicator state="connecting" />
        <LiveIndicator state="polling" />
      </div>
      <QuantityStepper value={2} label="Masala Chai" onChange={() => {}} />
    </div>
  ),
};
