import type { StorybookConfig } from '@storybook/react-vite';

/** Reuses vite.config.ts (React, Tailwind, `@/` alias) automatically. */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: { name: '@storybook/react-vite', options: {} },
  staticDirs: ['../public'],
};

export default config;
