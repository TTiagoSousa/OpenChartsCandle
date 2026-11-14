export const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

/** All colors used by the chart canvas and (through CSS variables) by the Terminal UI. */
export interface Theme {
  /** Chart / panel background */
  bg: string;
  /** Background behind the panels (the gaps between toolbars and chart) */
  appBg: string;
  /** Grid lines. Use 'transparent' to hide. */
  grid: string;
  /** Borders and separators */
  border: string;
  /** Axis labels and secondary text */
  text: string;
  /** Primary text */
  textStrong: string;
  /** Muted text */
  muted: string;
  /** Rising candle body */
  up: string;
  /** Falling candle body */
  down: string;
  /** Rising candle wick (default: up) */
  wickUp: string;
  /** Falling candle wick (default: down) */
  wickDown: string;
  /** Rising candle border (default: up) */
  borderUp: string;
  /** Falling candle border (default: down) */
  borderDown: string;
  /** Draw a border around candle bodies */
  candleBorder: boolean;
  /** Line / area / step chart color */
  line: string;
  crosshair: string;
  crosshairLabel: string;
  /** Selection, active tool and highlight color */
  accent: string;
  selection: string;
  handleFill: string;
  font: string;
  fontSize: number;
}

export const darkTheme: Theme = {
  bg: '#131722',
  appBg: '#0c0e15',
  grid: 'rgba(42, 46, 57, 0.55)',
  border: '#2a2e39',
  text: '#b2b5be',
  textStrong: '#d1d4dc',
  muted: '#787b86',
  up: '#089981',
  down: '#f23645',
  wickUp: '#089981',
  wickDown: '#f23645',
  borderUp: '#089981',
  borderDown: '#f23645',
  candleBorder: false,
  line: '#2962ff',
  crosshair: '#9598a1',
  crosshairLabel: '#363a45',
  accent: '#2962ff',
  selection: 'rgba(41, 98, 255, 0.18)',
  handleFill: '#131722',
  font: FONT,
  fontSize: 12,
};

export const lightTheme: Theme = {
  ...darkTheme,
  bg: '#ffffff',
  appBg: '#e9ecf2',
  grid: 'rgba(42, 46, 57, 0.07)',
  border: '#e0e3eb',
  text: '#434651',
  textStrong: '#131722',
  muted: '#787b86',
  crosshair: '#9598a1',
  crosshairLabel: '#131722',
  handleFill: '#ffffff',
};

/** Theme used by default for new charts (change with `setTheme`). */
export const defaultTheme: Theme = { ...darkTheme };

/**
 * The theme currently being rendered. Each chart copies its own theme in here
 * right before drawing, so renderers can simply read `theme.x`.
 */
export const theme: Theme = { ...darkTheme };

/** Build a full theme from a partial one; wick/border colors follow up/down unless given. */
export function resolveTheme(patch: Partial<Theme> = {}, base: Theme = defaultTheme): Theme {
  const t: Theme = { ...base, ...patch };
  if (patch.up && !patch.wickUp) t.wickUp = patch.up;
  if (patch.down && !patch.wickDown) t.wickDown = patch.down;
  if (patch.up && !patch.borderUp) t.borderUp = patch.up;
  if (patch.down && !patch.borderDown) t.borderDown = patch.down;
  if (patch.bg && !patch.handleFill) t.handleFill = patch.bg;
  return t;
}

export function font(size = theme.fontSize, weight = ''): string {
  return `${weight ? weight + ' ' : ''}${size}px ${theme.font}`;
}
