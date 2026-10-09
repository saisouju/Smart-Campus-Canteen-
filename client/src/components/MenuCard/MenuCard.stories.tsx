import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { menu, menuById } from '@/mocks/fixtures';
import { MenuCard } from './MenuCard';

const meta = {
  title: 'Customer/MenuCard',
  component: MenuCard,
  args: { item: menuById['masala-dosa']!, quantity: 0, onAdd: fn(), onQuantityChange: fn() },
  decorators: [(Story) => <div className="max-w-xs">{Story()}</div>],
} satisfies Meta<typeof MenuCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const InCart: Story = { args: { quantity: 2 } };
export const SoldOut: Story = { args: { item: menuById['upma']! } };
export const Drink: Story = { args: { item: menuById['cold-coffee']! } };

/** The full grid, stateful, as it appears on the student dashboard. */
export const MenuGrid: Story = {
  decorators: [(Story) => <div className="max-w-5xl">{Story()}</div>],
  render: function Render() {
    const [cart, setCart] = useState<Record<string, number>>({});
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menu.map((item) => (
          <MenuCard
            key={item.id}
            item={item}
            quantity={cart[item.id] ?? 0}
            onAdd={(i) => setCart((c) => ({ ...c, [i.id]: 1 }))}
            onQuantityChange={(i, q) => setCart((c) => ({ ...c, [i.id]: q }))}
          />
        ))}
      </div>
    );
  },
};
