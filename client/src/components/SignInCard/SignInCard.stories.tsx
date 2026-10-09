import type { Meta, StoryObj } from '@storybook/react-vite';
import { SignInCard } from './SignInCard';

const meta = {
  title: 'Auth/SignInCard',
  component: SignInCard,
  args: { signInHref: '#' },
  decorators: [(Story) => <div className="py-10">{Story()}</div>],
} satisfies Meta<typeof SignInCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WrongDomain: Story = { args: { error: 'domain' } };
export const Cancelled: Story = { args: { error: 'cancelled' } };
export const NotConfigured: Story = { args: { error: 'not_configured', disabled: true } };
