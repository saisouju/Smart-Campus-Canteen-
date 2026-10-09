import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { menu } from '@/mocks/fixtures';
import { MenuAvailabilityList } from './MenuAvailabilityList';

const meta = {
  title: 'Admin/MenuAvailabilityList',
  component: MenuAvailabilityList,
  args: { items: menu, onToggle: fn() },
  decorators: [(Story) => <div className="max-w-3xl">{Story()}</div>],
} satisfies Meta<typeof MenuAvailabilityList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: function Render(args) {
    const [items, setItems] = useState(args.items);
    return (
      <MenuAvailabilityList
        {...args}
        items={items}
        onToggle={(item, isAvailable) => setItems((list) => list.map((i) => (i.id === item.id ? { ...i, isAvailable } : i)))}
      />
    );
  },
};
