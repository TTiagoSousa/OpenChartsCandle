import type { Point } from '../core/types';
import { Emitter } from '../core/utils';
import type { PaneView } from '../core/view';
import { AxisMarks, Drawing, DrawingOptions, HitResult, SerializedDrawing } from './base';
export type MagnetMode = 'off' | 'weak' | 'strong';
/** Persistence for drawings, one list per symbol. */
export interface DrawingStorage {
    load(symbol: string): SerializedDrawing[];
    save(symbol: string, drawings: SerializedDrawing[]): void;
}
/** Default storage: browser localStorage under `${prefix}.drawings.${symbol}`. */
export declare function localDrawingStorage(prefix?: string): DrawingStorage;
export interface Mods {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
}
interface CreationState {
    d: Drawing;
    step: number;
    downX: number;
    downY: number;
    pressed: boolean;
    dragged: boolean;
    freehand: boolean;
    before: string;
}
interface DragState {
    d: Drawing;
    kind: 'handle' | 'move';
    index: number;
    startX: number;
    startY: number;
    orig: Point[];
    before: string;
    changed: boolean;
}
export declare class DrawingManager {
    private requestRender;
    private storage;
    drawings: Drawing[];
    tool: string | null;
    magnet: MagnetMode;
    stayInDrawMode: boolean;
    hideAll: boolean;
    lockAll: boolean;
    selected: Drawing | null;
    hovered: Drawing | null;
    hoverHit: HitResult | null;
    creating: CreationState | null;
    drag: DragState | null;
    private undoStack;
    private redoStack;
    private symbol;
    private clipboard;
    toolDefaults: Record<string, Partial<DrawingOptions>>;
    readonly changed: Emitter<void>;
    readonly selection: Emitter<Drawing | null>;
    readonly toolChanged: Emitter<string | null>;
    readonly textEdit: Emitter<Drawing>;
    readonly historyChanged: Emitter<void>;
    constructor(requestRender: () => void, storage?: DrawingStorage | null);
    load(symbol: string): void;
    save(): void;
    /** Serializable snapshot of all drawings (to store in your own backend). */
    toJSON(): SerializedDrawing[];
    /** Replace all drawings with a serialized list (e.g. loaded from your backend). */
    fromJSON(list: SerializedDrawing[]): void;
    private serialize;
    private restore;
    private pushUndo;
    /** Record current state before an external mutation (style change etc). */
    checkpoint(): void;
    commit(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    undo(): void;
    redo(): void;
    setTool(id: string | null): void;
    select(d: Drawing | null): void;
    remove(d: Drawing): void;
    deleteSelected(): void;
    clearAll(): void;
    copySelected(): void;
    paste(v: PaneView): void;
    /**
     * Create a drawing from code, e.g. `add('trendline', [{ time, price }, { time, price }], { color: '#f00' })`.
     * Tool ids are listed in `ALL_TOOLS`. Returns null for unknown ids.
     */
    add(type: string, points: Point[], opts?: Partial<DrawingOptions>): Drawing | null;
    clone(d: Drawing): void;
    bringToFront(d: Drawing): void;
    sendToBack(d: Drawing): void;
    /** Apply option change to a drawing, recording undo + remembering as tool default. */
    updateOptions(d: Drawing, patch: Partial<DrawingOptions>, remember?: boolean): void;
    snap(v: PaneView, x: number, y: number, freeTime?: boolean): Point;
    hitTest(v: PaneView, x: number, y: number): {
        d: Drawing;
        hit: HitResult;
    } | null;
    hover(v: PaneView, x: number, y: number): string | null;
    isBusy(): boolean;
    pointerDown(v: PaneView, x: number, y: number, m: Mods): boolean;
    pointerMove(v: PaneView, x: number, y: number, m: Mods): void;
    pointerUp(v: PaneView, x: number, y: number, m: Mods): void;
    doubleClick(v: PaneView, x: number, y: number): Drawing | null;
    private createStep;
    finishCreation(): void;
    cancelCreation(): void;
    draw(v: PaneView): void;
    /** Axis highlights for the active drawing + persistent price labels (e.g. horizontal lines). */
    axisMarks(v: PaneView): {
        active: AxisMarks | null;
        persistent: {
            price: number;
            color: string;
        }[];
        persistentTimes: {
            time: number;
            color: string;
        }[];
    };
}
export {};
