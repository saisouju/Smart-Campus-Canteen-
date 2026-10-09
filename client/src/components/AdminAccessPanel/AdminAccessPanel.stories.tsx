import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { adminEmails } from '@/mocks/fixtures';
import { AdminAccessPanel } from './AdminAccessPanel';

const meta = {
  title: 'Admin/AdminAccessPanel',
  component: AdminAccessPanel,
  args: { admins: adminEmails, currentEmail: adminEmails[0]!.email, onAdd: fn(), onRemove: fn() },
  decorators: [(Story) => <div className="max-w-xl">{Story()}</div>],
} satisfies Meta<typeof AdminAccessPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Add and remove admins locally. */
export const Interactive: Story = {
  render: function Render(args) {
    const [admins, setAdmins] = useState(args.admins);
    return (
      <AdminAccessPanel
        {...args}
        admins={admins}
        onAdd={(email) =>
          setAdmins((list) => [
            ...list,
            { email, addedBy: args.currentEmail ?? null, addedAt: '2026-10-07 18:00:00', permanent: false, hasSignedIn: false },
          ])
        }
        onRemove={(email) => setAdmins((list) => list.filter((a) => a.email !== email))}
      />
    );
  },
};
export const OnlyFounder: Story = { args: { admins: adminEmails.slice(0, 1) } };
export const WithError: Story = { args: { error: 'someone@klh.edu.in is already an admin' } };
