import { Bar, ChartType } from './types';
import { PaneView } from './view';
/** lightweight-charts' optimal candle body width (bitmap pixels). */
export declare function optimalBarWidth(barSpacing: number, pr: number): number;
export declare function heikinAshi(src: Bar[], out: Bar[], from: number): Bar[];
export interface SeriesColors {
    up: string;
    down: string;
    wickUp: string;
    wickDown: string;
    borderUp: string;
    borderDown: string;
    border: boolean;
    line: string;
}
/** Series colors from the theme currently being rendered. */
export declare function seriesColorsFromTheme(): SeriesColors;
export declare function drawSeries(v: PaneView, type: ChartType, bars: Bar[], colors?: SeriesColors): void;
