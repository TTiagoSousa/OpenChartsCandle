import type { Chart } from '../core/chart';
import type { Indicator } from '../indicators/indicators';
export interface LegendCallbacks {
    onSettings: (ind: Indicator) => void;
    onRemove: (ind: Indicator) => void;
    onToggle: (ind: Indicator) => void;
    onSymbolClick: () => void;
}
/** DOM legends (OHLC + indicator values) positioned over each pane. */
export declare class Legend {
    private chart;
    private cb;
    private root;
    private index;
    private collapsed;
    constructor(host: HTMLElement, chart: Chart, cb: LegendCallbacks);
    private paneEls;
    private ohlcEl;
    private titleEl;
    rebuild(): void;
    update(): void;
}
