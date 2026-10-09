import type { Preview } from '@storybook/react-vite';
import '../src/index.css';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';

/** Stories render inside the exact provider stack the app uses. */
const preview: Preview = {
  decorators: [
    (Story) => (
      <AppThemeProvider>
        <div className="p-4 font-sans text-ink">
          <Story />
        </div>
      </AppThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
