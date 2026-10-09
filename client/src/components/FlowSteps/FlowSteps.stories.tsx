import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlowSteps } from './FlowSteps';

const meta = {
  title: 'Customer/FlowSteps',
  component: FlowSteps,
  args: { active: 2 },
  argTypes: { active: { control: { type: 'range', min: 1, max: 4, step: 1 } } },
} satisfies Meta<typeof FlowSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PickFood: Story = { args: { active: 1 } };
export const ChooseSlot: Story = {};
export const Tracking: Story = { args: { active: 4 } };
