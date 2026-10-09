import { useTheme } from '@mui/material/styles';

/**
 * Chart colors resolved to MUI CSS variables, so charts follow the active
 * light/dark scheme without re-rendering. Text never wears the series color.
 */
export function useChartTokens() {
  const theme = useTheme();
  const vars = theme.vars ?? theme;
  return {
    seriesPrimary: vars.palette.primary.main,
    seriesSecondary: vars.palette.secondary.main,
    grid: vars.palette.divider,
    textPrimary: vars.palette.text.primary,
    textSecondary: vars.palette.text.secondary,
    surface: vars.palette.background.paper,
    cursor: `color-mix(in srgb, ${vars.palette.primary.main} 8%, transparent)`,
  };
}

export const axisTick = (fill: string) => ({ fill, fontSize: 12 });
