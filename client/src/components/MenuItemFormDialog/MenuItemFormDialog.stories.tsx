import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MenuItemFormDialog } from './MenuItemFormDialog';

const meta = {
  title: 'Admin/MenuItemFormDialog',
  component: MenuItemFormDialog,
  args: { open: true, onClose: fn(), onSubmit: fn() },
} satisfies Meta<typeof MenuItemFormDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AddNew: Story = {};
export const Prefilled: Story = {
  args: { initial: { name: 'Lemon Rice', category: 'Lunch', price: 65, isAvailable: true } },
};
export const Saving: Story = { args: { submitting: true } };
export const ServerError: Story = { args: { error: 'Requires role: admin' } };
