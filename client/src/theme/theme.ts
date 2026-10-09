import { createTheme } from '@mui/material/styles';

const display = '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif';
const body = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';

/**
 * Single source of truth for color. `cssVariables` exposes every token as
 * --mui-* custom properties, which Tailwind re-exports in index.css.
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#c2410c', contrastText: '#fff7ed' },
        secondary: { main: '#166534' },
        background: { default: '#faf7f2', paper: '#ffffff' },
        text: { primary: '#1c1917', secondary: '#57534e' },
        divider: '#e7e2da',
      },
    },
    dark: {
      palette: {
        primary: { main: '#fb923c', contrastText: '#1c1917' },
        secondary: { main: '#4ade80' },
        background: { default: '#141210', paper: '#1d1a17' },
        text: { primary: '#f5f5f4', secondary: '#c3bdb5' },
        divider: '#34302b',
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: body,
    h1: { fontFamily: display, fontWeight: 800 },
    h2: { fontFamily: display, fontWeight: 800 },
    h3: { fontFamily: display, fontWeight: 700 },
    h4: { fontFamily: display, fontWeight: 700 },
    h5: { fontFamily: display, fontWeight: 700 },
    h6: { fontFamily: display, fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
  },
});
