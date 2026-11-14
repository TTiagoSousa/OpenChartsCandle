/** A size along a dimension: px (number), a flex weight ('2fr'), a share of the room ('25%') or 'auto' (= '1fr'). */
export type MatrixLength = number | string;
/** One header cell. Children make a multi-level header: the parent spans all its leaves. */
export interface MatrixHeaderItem {
    /** Text of the header cell (also its name, used to address body cells) */
    value: string | number;
    children?: MatrixHeaderInput[];
    /** Size of this column / row (leaves only): px, 'Nfr' or '%' */
    size?: MatrixLength;
    /** Background of this header cell */
    color?: string;
    itemStyle?: MatrixCellStyle;
    label?: MatrixLabel;
    /** Any payload, handed back in MatrixCellInfo.data */
    data?: unknown;
}
export type MatrixHeaderInput = string | number | MatrixHeaderItem;
/** Per-level look of a header (level 0 = the outermost). */
export interface MatrixHeaderLevel {
    /** Thickness of this level: px. x → row height, y → column width. Default auto */
    size?: number;
    itemStyle?: MatrixCellStyle;
    label?: MatrixLabel;
}
/** The x (columns) or the y (rows) dimension. */
export interface MatrixDimension {
    /** Header tree, or a count of plain leaves (shown without a header by default) */
    data: MatrixHeaderInput[] | number;
    /** Show the header. Default true (false when `data` is a count) */
    show?: boolean;
    /** Size of every leaf column / row: one value, or one per leaf. Default '1fr' */
    cellSize?: MatrixLength | MatrixLength[];
    /** Minimum leaf size in px when flexing. Default 0 */
    minCellSize?: number;
    /** Thickness of every header level in px (x: height, y: width). Default auto (from the font) */
    levelSize?: number | number[];
    levels?: MatrixHeaderLevel[];
    itemStyle?: MatrixCellStyle;
    label?: MatrixLabel;
}
export interface MatrixCellStyle {
    /** Background */
    color?: string;
    borderColor?: string;
    /** px; 0 = no border */
    borderWidth?: number;
    /** Corner radius, px */
    radius?: number;
    /** 0–1 */
    opacity?: number;
}
export interface MatrixLabel {
    show?: boolean;
    /** Text of the cell; return '' for none. Default: the value (numbers through `valueFormatter`) */
    formatter?: (cell: MatrixCellInfo) => string;
    /** Default: picked to read on the background */
    color?: string;
    fontSize?: number;
    fontWeight?: number | string;
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    /** Inner space, px. Default 4 */
    padding?: number;
}
/**
 * Where a body cell goes: a leaf index, a header name (a parent spans its leaves) or a range [from, to]
 * (both included) — a range or a parent merges the cell.
 */
export type MatrixCoordPart = number | string | [number | string, number | string];
export interface MatrixCell {
    /** [x, y] */
    coord: [MatrixCoordPart, MatrixCoordPart];
    /** Stable key (animations, embedded charts kept across re-flows). Default: from the coord */
    id?: string;
    /** Number (colored by `visualMap`), text, or anything for `renderCell` / `mount` */
    value?: unknown;
    /** Fixed text (overrides the formatter) */
    text?: string;
    /** Merge to the right / downwards, in leaves */
    colSpan?: number;
    rowSpan?: number;
    /** Background (overrides the visualMap) */
    color?: string;
    itemStyle?: MatrixCellStyle;
    label?: MatrixLabel;
    /** Not drawn at all (a hole in the grid) */
    hidden?: boolean;
    /** No hover / tooltip / click */
    silent?: boolean;
    /** Draw this cell yourself (overrides the matrix's `renderCell`) */
    render?: MatrixRenderCell;
    /** Embed a DOM element / any chart in this cell (overrides the matrix's `mount`) */
    mount?: MatrixMountCell | null;
    /** Any payload, handed back in MatrixCellInfo.data */
    data?: unknown;
}
/** Plain values by row: `values[y][x]` (null / undefined = empty). */
export type MatrixValueGrid = unknown[][];
export interface MatrixRect {
    x: number;
    y: number;
    w: number;
    h: number;
}
export type MatrixCellKind = 'body' | 'x' | 'y' | 'corner';
/** A cell as handed to formatters, renderers, mounts, the tooltip and events. */
export interface MatrixCellInfo {
    kind: MatrixCellKind;
    id: string;
    /** First leaf column / row (-1 for the other dimension of a header cell) */
    x: number;
    y: number;
    xSpan: number;
    ySpan: number;
    /** Names of the leaves at x / y ('' outside the body) */
    xName: string;
    yName: string;
    /** Header names from the outermost level down to the leaf */
    xPath: string[];
    yPath: string[];
    value: unknown;
    /** Text shown in the cell */
    text: string;
    /** Background color (after the visualMap); '' when none */
    color: string;
    /** Header level (headers only) */
    level: number;
    rect: MatrixRect;
    /** The input cell (body) or header item */
    data: MatrixCell | MatrixHeaderItem | undefined;
}
export type MatrixRenderCell = (ctx: CanvasRenderingContext2D, rect: MatrixRect, cell: MatrixCellInfo, api: MatrixDrawApi) => void;
/** Put anything into `el` (absolutely positioned over the cell, resized with it). Return a cleanup. */
export type MatrixMountCell = (el: HTMLElement, cell: MatrixCellInfo) => (() => void) | void;
export interface MatrixVisualPiece {
    /** [min, max) — or an exact `value` (number or category text) */
    min?: number;
    max?: number;
    value?: number | string;
    color: string;
    label?: string;
}
export interface MatrixVisualMap {
    /** Default: the data range */
    min?: number;
    max?: number;
    /** Continuous gradient, low → high. Default blue → white-ish → red */
    colors?: string[];
    /** Piecewise: ranges or categories (the legend toggles them) */
    pieces?: MatrixVisualPiece[];
    /** What is colored. Default: the cell value (numbers; strings for category pieces) */
    dimension?: (cell: MatrixCellInfo) => number | string | null | undefined;
    /** Color bar / legend. Default true */
    show?: boolean;
    position?: 'right' | 'bottom';
    /** Labels at the [high, low] ends of the bar */
    text?: [string, string];
    formatter?: (v: number) => string;
    /** Color of values outside every piece. Default none */
    outOfRange?: string;
}
export interface MatrixTheme {
    background: string;
    text: string;
    muted: string;
    /** Grid lines / cell borders */
    border: string;
    /** Background of empty body cells */
    cellBg: string;
    headerBg: string;
    headerText: string;
    cornerBg: string;
    /** Row / column highlight under the mouse */
    hover: string;
    /** Outline of selected cells */
    select: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
/** Options applied while the container matches a query (later rules win). */
export interface MatrixMediaRule {
    query: {
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
        minAspectRatio?: number;
        maxAspectRatio?: number;
    };
    option: Partial<MatrixOptions>;
}
export interface MatrixDrawApi {
    /** Rect of a body cell / range by coord (names or leaf indices), or null */
    cellRect(x: MatrixCoordPart, y: MatrixCoordPart): MatrixRect | null;
    /** Leaf column / row → px (start and size) */
    column(x: number): {
        x: number;
        w: number;
    };
    row(y: number): {
        y: number;
        h: number;
    };
    /** Body area */
    body: MatrixRect;
    width: number;
    height: number;
    theme: MatrixTheme;
    /** Cell under the mouse (body or header) */
    hover: MatrixCellInfo | null;
    /** Entry animation progress 0–1 */
    progress: number;
    /** Body cells */
    cells: MatrixCellInfo[];
    /** The visualMap color of a value */
    colorOf(v: number | string): string;
}
export interface MatrixOptions {
    /** Columns */
    x?: MatrixDimension;
    /** Rows */
    y?: MatrixDimension;
    /** Body cells: a list, or plain values by row `values[y][x]` */
    data?: MatrixCell[] | MatrixValueGrid;
    /** Top-left cell over the y header and next to the x header */
    corner?: {
        text?: string;
        color?: string;
        itemStyle?: MatrixCellStyle;
        label?: MatrixLabel;
    };
    /** Look of every body cell */
    itemStyle?: MatrixCellStyle;
    label?: MatrixLabel;
    /** Empty body cells: 'show' (drawn with borders) or 'hide'. Default 'show' */
    emptyCells?: 'show' | 'hide';
    /** Space between cells, px (cards). Default 0 (shared grid lines) */
    gap?: number;
    /** Fixed width / height ratio of the leaf cells (1 = squares); the matrix is centered */
    cellAspect?: number;
    /** Space around the matrix, px or [top, right, bottom, left]. Default 8 */
    padding?: number | [number, number, number, number];
    visualMap?: MatrixVisualMap | false;
    /** Draw every body cell yourself (fast: thousands of cells) */
    renderCell?: MatrixRenderCell;
    /** Embed a DOM element / a chart in every body cell (cells with `mount: null` are skipped) */
    mount?: MatrixMountCell;
    /** Inner space of the mounted elements, px. Default 2 */
    mountPadding?: number;
    /** Draw over the whole matrix (edges across cells, annotations) */
    graphic?: (ctx: CanvasRenderingContext2D, api: MatrixDrawApi) => void;
    /** Highlight under the mouse: 'cross' (row + column), 'row', 'column', 'cell' or false. Default 'cross' */
    emphasis?: 'cross' | 'row' | 'column' | 'cell' | false;
    /** Click selects cells (headers select their row / column). Default false */
    select?: boolean | 'single' | 'multiple';
    tooltip?: boolean | {
        show?: boolean;
        formatter?: (cell: MatrixCellInfo) => string;
        headers?: boolean;
    };
    valueFormatter?: (v: number) => string;
    /** Options by container size, e.g. fewer columns on narrow screens */
    media?: MatrixMediaRule[];
    title?: string | {
        text: string;
        subtext?: string;
        align?: 'left' | 'center' | 'right';
    };
    /** 'transparent' for cards. Shortcut for theme.background */
    background?: string;
    theme?: 'dark' | 'light' | Partial<MatrixTheme>;
    /** Cells fade / grow in. Default true */
    animation?: boolean | {
        duration?: number;
        stagger?: number;
    };
}
export type MatrixEvent = 'hover' | 'click' | 'select' | 'media';
