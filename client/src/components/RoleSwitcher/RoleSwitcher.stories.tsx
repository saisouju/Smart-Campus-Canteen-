import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { RoleSwitcher, type RoleView } from './RoleSwitcher';

const meta = {
  title: 'Shared/RoleSwitcher',
  component: RoleSwitcher,
  args: { view: 'admin', onViewChange: fn() },
} satisfies Meta<typeof RoleSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: function Render(args) {
    const [view, setView] = useState<RoleView>(args.view);
    return <RoleSwitcher view={view} onViewChange={setView} />;
  },
};
export const CustomerView: Story = { args: { view: 'customer' } };
