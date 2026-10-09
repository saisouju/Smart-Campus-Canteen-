import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { CategoryTabs, type CategoryFilter } from './CategoryTabs';

const meta = {
  title: 'Customer/CategoryTabs',
  component: CategoryTabs,
  args: { value: 'All', onChange: fn(), counts: { All: 20, Breakfast: 5, Lunch: 5, Snacks: 5, Drinks: 5 } },
} satisfies Meta<typeof CategoryTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<CategoryFilter>(args.value);
    return <CategoryTabs {...args} value={value} onChange={setValue} />;
  },
};
export const WithoutCounts: Story = { args: { counts: undefined } };
