export declare const FONT = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif";
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
export declare const darkTheme: Theme;
export declare const lightTheme: Theme;
/** Theme used by default for new charts (change with `setTheme`). */
export declare const defaultTheme: Theme;
/**
 * The theme currently being rendered. Each chart copies its own theme in here
 * right before drawing, so renderers can simply read `theme.x`.
 */
export declare const theme: Theme;
/** Build a full theme from a partial one; wick/border colors follow up/down unless given. */
export declare function resolveTheme(patch?: Partial<Theme>, base?: Theme): Theme;
export declare function font(size?: number, weight?: string): string;
