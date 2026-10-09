import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { users } from '@/mocks/fixtures';
import { UserMenu } from './UserMenu';

const meta = {
  title: 'Auth/UserMenu',
  component: UserMenu,
  args: { user: users[0]!, onSignOut: fn() },
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Student: Story = {};
export const Admin: Story = { args: { user: users[3]! } };
