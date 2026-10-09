import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { theme } from './theme';

/**
 * Wraps both the app (main.tsx) and every Storybook story (.storybook/preview.tsx),
 * so components render identically in isolation and in production.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <StyledEngineProvider enableCssLayer>
      {/* Declares layer order before Emotion injects anything; must match index.css. */}
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
