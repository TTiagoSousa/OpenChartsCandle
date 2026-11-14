import type { Chart } from '../core/chart';
import type { SymbolInfo } from '../core/types';
import type { Drawing } from '../drawings/base';
import { type Indicator } from '../indicators/indicators';
export declare function symbolSearch(symbols: SymbolInfo[], onPick: (s: SymbolInfo) => void): void;
/** An entry of the indicators dialog. */
export interface IndicatorChoice {
    id: string;
    name: string;
    description: string;
}
/** The simulation's section of the indicators dialog: one checkbox per indicator to show or hide it. */
export interface SimulationChoices {
    title: string;
    items: () => (IndicatorChoice & {
        on: boolean;
    })[];
    onToggle: (id: string, on: boolean) => void;
}
export declare function indicatorsDialog(choices: IndicatorChoice[], onPick: (c: IndicatorChoice) => void, sim?: SimulationChoices): void;
declare function colorButton(color: string, onChange: (c: string) => void): HTMLElement;
/**
 * The settings of an indicator, in TradingView's tabs: Valores (inputs), Estilo (colours and lines) and
 * Visibilidade (on which timeframes it shows). "Padrões" puts the defaults back; "Cancelar" undoes all.
 */
export declare function indicatorSettings(chart: Chart, ind: Indicator, onChange: () => void): void;
export declare function drawingSettings(chart: Chart, d: Drawing): void;
/** Inline text editor overlay for text drawings. */
export declare function editText(chart: Chart, d: Drawing): void;
export { colorButton };
