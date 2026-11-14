/** Types of the custom family: series drawn item by item by a `renderItem` function. */
/** A gradient fill / stroke, in the element's local px (or 0–1 of its box with `global: false`). */
export interface CustomGradient {
    type: 'linear' | 'radial';
    /** linear: from (x, y) to (x2, y2); radial: center (x, y), radius r */
    x?: number;
    y?: number;
    x2?: number;
    y2?: number;
    r?: number;
    /** [offset 0–1, color] */
    stops: [number, string][];
    /** true: coordinates in px; false (default): fractions 0–1 of the element's bounding box */
    global?: boolean;
}
export type CustomPaint = string | CustomGradient;
export interface CustomStyle {
    fill?: CustomPaint;
    stroke?: CustomPaint;
    /** px. Default 1 when there is a stroke */
    lineWidth?: number;
    /** 0–1, multiplies everything (fill, stroke, text) */
    opacity?: number;
    fillOpacity?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    shadowBlur?: number;
    shadowColor?: string;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    /** text elements: the text (`\n` for lines) */
    text?: string | number;
    fontSize?: number;
    fontWeight?: number | string;
    fontFamily?: string;
    /** Full CSS font; wins over fontSize / fontWeight / fontFamily */
    font?: string;
    align?: CanvasTextAlign;
    verticalAlign?: 'top' | 'middle' | 'bottom';
    /** Line height of multi-line text, px. Default fontSize × 1.25 */
    lineHeight?: number;
    /** image elements: an URL or something drawImage accepts */
    image?: string | CanvasImageSource;
}
/** Text placed on an element's bounding box (e.g. the name inside a flame-graph rect). */
export interface CustomLabel {
    text: string | number;
    /** Default 'inside' */
    position?: 'inside' | 'insideLeft' | 'insideRight' | 'insideTop' | 'insideBottom' | 'top' | 'bottom' | 'left' | 'right';
    /** Default: readable on the fill (inside) or the theme text (outside) */
    color?: string;
    fontSize?: number;
    fontWeight?: number | string;
    /** px between the box and the text. Default 4 */
    distance?: number;
    /** Text wider than the box (inside positions): cut with "…" (default), hide, or let it overflow */
    overflow?: 'truncate' | 'hide' | 'none';
    /** Halo around the text for contrast */
    stroke?: string;
}
/** Props an element can start from (`enterFrom`) or go to when it is removed (`leaveTo`). */
export interface CustomTransitionProps {
    /** 0–1 */
    opacity?: number;
    /** Uniform scale around the element's center (0 = pops from nothing) */
    scale?: number;
    x?: number;
    y?: number;
    rotation?: number;
    shape?: Record<string, unknown>;
    style?: Partial<CustomStyle>;
}
interface CustomElementBase {
    /** Key for transitions: elements with the same id (in any series) morph into each other */
    id?: string | number;
    /** Translation, px */
    x?: number;
    y?: number;
    /** Radians, clockwise (around originX / originY) */
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    originX?: number;
    originY?: number;
    style?: CustomStyle;
    /** Style while the data item is hovered (merged over `style`) */
    emphasis?: {
        style?: CustomStyle;
    };
    /** Not hit by the mouse */
    silent?: boolean;
    /** Not drawn */
    ignore?: boolean;
    /** Drawing order inside the series (higher on top). Default 0 */
    z?: number;
    label?: CustomLabel;
    /** Where the element appears from. Default { opacity: 0 } */
    enterFrom?: CustomTransitionProps;
    /** Where it goes when removed. Default { opacity: 0 } */
    leaveTo?: CustomTransitionProps;
    /** Anything; passed back in hover / click events as `info` */
    info?: unknown;
    /** Can be dragged with the mouse (events 'dragstart' / 'drag' / 'dragend') */
    draggable?: boolean;
    /** Cursor while over it */
    cursor?: string;
}
export interface CustomRectElement extends CustomElementBase {
    type: 'rect';
    /** r = corner radius (px, or [tl, tr, br, bl]) */
    shape: {
        x: number;
        y: number;
        width: number;
        height: number;
        r?: number | number[];
    };
}
export interface CustomCircleElement extends CustomElementBase {
    type: 'circle';
    shape: {
        cx: number;
        cy: number;
        r: number;
    };
}
export interface CustomEllipseElement extends CustomElementBase {
    type: 'ellipse';
    shape: {
        cx: number;
        cy: number;
        rx: number;
        ry: number;
    };
}
/** A ring slice. Angles in radians, 0 = 3 o'clock, growing clockwise (canvas convention). */
export interface CustomSectorElement extends CustomElementBase {
    type: 'sector';
    shape: {
        cx: number;
        cy: number;
        r: number;
        r0?: number;
        startAngle: number;
        endAngle: number;
    };
}
/** An arc line (stroke only). */
export interface CustomArcElement extends CustomElementBase {
    type: 'arc';
    shape: {
        cx: number;
        cy: number;
        r: number;
        startAngle: number;
        endAngle: number;
    };
}
export interface CustomPolygonElement extends CustomElementBase {
    type: 'polygon';
    shape: {
        points: [number, number][];
        smooth?: boolean;
    };
}
export interface CustomPolylineElement extends CustomElementBase {
    type: 'polyline';
    shape: {
        points: [number, number][];
        smooth?: boolean;
    };
}
export interface CustomLineElement extends CustomElementBase {
    type: 'line';
    shape: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
}
/** Text at (x, y) of the element: style.text, style.fill, style.fontSize, style.align… */
export interface CustomTextElement extends CustomElementBase {
    type: 'text';
}
/**
 * An SVG path (`d` string). With width / height the path is fitted into that box
 * (`layout: 'center'` keeps its proportions, 'cover' stretches it).
 */
export interface CustomPathElement extends CustomElementBase {
    type: 'path';
    shape: {
        pathData: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        layout?: 'center' | 'cover';
    };
}
export interface CustomImageElement extends CustomElementBase {
    type: 'image';
    shape: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export interface CustomGroupElement extends CustomElementBase {
    type: 'group';
    children: (CustomElement | null | undefined | false)[];
}
export type CustomElement = CustomRectElement | CustomCircleElement | CustomEllipseElement | CustomSectorElement | CustomArcElement | CustomPolygonElement | CustomPolylineElement | CustomLineElement | CustomTextElement | CustomPathElement | CustomImageElement | CustomGroupElement;
export type CustomShapeType = Exclude<CustomElement['type'], 'group'>;
export interface CustomRenderParams {
    seriesIndex: number;
    seriesName: string;
    dataIndex: number;
    /** Number of items of the series */
    dataCount: number;
    /** The raw data item */
    data: unknown;
    /** Color of the series */
    color: string;
    coordSys: CustomCoordInfo;
    /** ms since the chart was created (moves every frame with `live: true`) */
    time: number;
    /** Index of the data item hovered in this series (-1 = none) */
    hoverIndex: number;
}
export type CustomCoordInfo = {
    type: 'cartesian';
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: 'polar';
    cx: number;
    cy: number;
    r0: number;
    r: number;
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: 'none';
    x: number;
    y: number;
    width: number;
    height: number;
};
export interface CustomPolarHelpers {
    cx: number;
    cy: number;
    /** inner and outer radius, px */
    r0: number;
    r: number;
    /** Angle (radians, canvas convention) of an angle-axis value */
    angle(v: unknown): number;
    /** Distance from the center (px) of a radius-axis value */
    radius(v: unknown): number;
    /** Point at an angle (radians) and a distance (px) */
    point(angle: number, r: number): [number, number];
}
export interface CustomBarLayout {
    /** px from the center of the category band to the center of the bar */
    offset: number;
    width: number;
}
export interface CustomRenderApi {
    /** Value of a dimension (index or name) of the current item (or of item `dataIndex`) */
    value(dim: number | string, dataIndex?: number): any;
    /**
     * Data → px. Cartesian: [x, y]; polar: [angle, radius]; none: returned as is.
     * Category values may be the name or the index.
     */
    coord(values: unknown[]): [number, number];
    /**
     * Size in px of a data span. Cartesian: [dx, dy] → [w, h] (a category = its band);
     * polar: [dAngle, dRadius] → [radians, px].
     */
    size(span: unknown[], at?: unknown[]): [number, number];
    /** Default style of the series (fill = its color), merged with `extra` */
    style(extra?: CustomStyle): CustomStyle;
    /** 'color' of the series */
    visual(name: 'color'): string;
    /** Width and offset of `count` bars side by side in a category band */
    barLayout(opts: {
        count: number;
        gap?: number;
        categoryGap?: number;
    }): CustomBarLayout[];
    /** Px of a data value along one axis ('x' | 'y' | 'angle' | 'radius') */
    scale(axis: 'x' | 'y' | 'angle' | 'radius', v: unknown): number;
    /** Category names of an axis */
    categories(axis: 'x' | 'y' | 'angle' | 'radius'): string[];
    /** The plot rectangle (the grid in cartesian; the whole plot otherwise) */
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /** Size of the canvas, px */
    width: number;
    height: number;
    /** Polar helpers (only with coordinateSystem 'polar') */
    polar: CustomPolarHelpers | null;
    /** Canvas context, for measuring text (do not draw here: return elements) */
    ctx: CanvasRenderingContext2D;
    /** Transition progress 0–1 of the current setData / setOptions animation (1 when idle) */
    progress: number;
    /** ms since the chart was created */
    time: number;
    /** Colors of the theme */
    theme: CustomTheme;
    /** The x / y view range while zoomed (data units), or null */
    view: {
        x: [number, number] | null;
        y: [number, number] | null;
    };
    /** Pixel width of `text` in a font size / weight */
    measureText(text: string, fontSize?: number, fontWeight?: number | string): number;
}
export type CustomRenderItem = (params: CustomRenderParams, api: CustomRenderApi) => CustomElement | null | undefined | false;
export interface CustomSeries {
    type?: 'custom';
    name?: string;
    data: unknown[];
    renderItem: CustomRenderItem;
    color?: string;
    /** Names of the dimensions (array items): value('low') and the tooltip use them */
    dimensions?: string[];
    /**
     * Which dimensions map to each axis (for the axis ranges), and which go in the default tooltip.
     * Default x = 0, y = 1 (angle = 0, radius = 1).
     */
    encode?: {
        x?: number | string | (number | string)[];
        y?: number | string | (number | string)[];
        angle?: number | string | (number | string)[];
        radius?: number | string | (number | string)[];
        tooltip?: (number | string)[];
        /** Dimension with the item's name (tooltip title) */
        itemName?: number | string;
    };
    /** Clip to the grid. Default true in cartesian, false otherwise */
    clip?: boolean;
    /** Stacking order between series. Default 0 */
    z?: number;
    /** Not hit by the mouse */
    silent?: boolean;
    /**
     * Hover: style merged on the hovered item; focus 'self' fades the other items. scope 'element' highlights only
     * the element under the mouse (not every element of the data item)
     */
    emphasis?: {
        style?: CustomStyle;
        focus?: 'none' | 'self' | 'series';
        disabled?: boolean;
        scope?: 'item' | 'element';
    };
    /** Tooltip of this series */
    tooltip?: false | ((p: CustomEventParams) => string);
    /** Not counted in the axis ranges */
    excludeFromRange?: boolean;
    /** Shown in the legend. Default true when it has a name */
    legend?: boolean;
}
export type CustomAxisType = 'value' | 'category' | 'time' | 'log';
export interface CustomAxis {
    /** Default true */
    show?: boolean;
    /** Default 'value' (or 'category' when the data are strings) */
    type?: CustomAxisType;
    /** Categories in order (default: the data in order of appearance) */
    data?: string[];
    name?: string;
    /** 'end' (default) or 'middle' */
    nameLocation?: 'end' | 'middle';
    /** Fixed range; 'dataMin' / 'dataMax' = the exact data range; a function gets the data extent */
    min?: number | 'dataMin' | ((ext: {
        min: number;
        max: number;
    }) => number);
    max?: number | 'dataMax' | ((ext: {
        min: number;
        max: number;
    }) => number);
    /** Value axis: include 0. Default true */
    beginAtZero?: boolean;
    /** Approximate number of ticks. Default 5 (x) / 5 (y) */
    splitNumber?: number;
    /** Fixed tick interval (value axes) */
    interval?: number;
    /** Upside down */
    inverse?: boolean;
    /** Log base. Default 10 */
    logBase?: number;
    /** Category axis: items in the middle of each band (default true) */
    boundaryGap?: boolean;
    /** Grid lines. Default true for value / time / log on y, false on x */
    splitLine?: boolean;
    /** Alternate shaded bands between ticks */
    splitArea?: boolean;
    /** Axis line. Default true for x */
    axisLine?: boolean;
    /** Small tick marks. Default false */
    axisTick?: boolean;
    /** Label text */
    format?: (v: number, category?: string) => string;
    /** Rotate the labels (degrees) */
    rotate?: number;
    /** Show every n-th category label (0 = all). Default automatic */
    labelInterval?: number;
    /** Other side: x on top, y on the right */
    opposite?: boolean;
    color?: string;
    /** Polar angle axis: angle of the first value, degrees (90 = 12 o'clock). Default 90 */
    startAngle?: number;
    /** Polar angle axis: clockwise. Default true */
    clockwise?: boolean;
}
export interface CustomTheme {
    background: string;
    text: string;
    muted: string;
    grid: string;
    axis: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
export interface CustomEventParams {
    seriesIndex: number;
    seriesName: string;
    dataIndex: number;
    /** The raw data item */
    data: unknown;
    /** The item as an array of values (by dimension) */
    value: unknown[];
    name?: string;
    color: string;
    /** `info` of the element under the mouse */
    info?: unknown;
    /** Mouse position in the canvas, px */
    x: number;
    y: number;
}
export interface CustomDragEvent extends CustomEventParams {
    /** px moved since the start */
    dx: number;
    dy: number;
    /** Data value under the mouse (convertFromPixel) */
    at: [unknown, unknown];
}
export interface CustomGraphicInfo {
    width: number;
    height: number;
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    theme: CustomTheme;
    time: number;
    ctx: CanvasRenderingContext2D;
}
export interface CustomOptions {
    /** Default 'cartesian' */
    coordinateSystem?: 'cartesian' | 'polar' | 'none';
    series: CustomSeries[];
    xAxis?: CustomAxis;
    yAxis?: CustomAxis;
    angleAxis?: CustomAxis;
    radiusAxis?: CustomAxis;
    /** Space around the grid (px or '%'). Default: room for the axis labels */
    grid?: {
        left?: number | string;
        right?: number | string;
        top?: number | string;
        bottom?: number | string;
    };
    /** Polar: center ['50%', '50%'] and radius (outer, or [inner, outer]) in px or '%' of half the smaller side */
    polar?: {
        center?: [number | string, number | string];
        radius?: number | string | [number | string, number | string];
    };
    /** Palette (one color per series) */
    colors?: string[];
    legend?: boolean | {
        show?: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
        interactive?: boolean;
    };
    tooltip?: boolean | {
        show?: boolean;
        formatter?: (p: CustomEventParams) => string;
    };
    valueFormatter?: (v: number) => string;
    title?: string | {
        text: string;
        subtext?: string;
        align?: 'left' | 'center' | 'right';
    };
    /** 'transparent' for cards. Shortcut for theme.background */
    background?: string;
    theme?: 'dark' | 'light' | Partial<CustomTheme>;
    /** Default true. delay(dataIndex, seriesIndex) staggers the items */
    animation?: boolean | {
        duration?: number;
        easing?: CustomEasing;
        delay?: (dataIndex: number, seriesIndex: number) => number;
    };
    /** Re-run renderItem every frame (api.time moves): for animated effects */
    live?: boolean;
    /** Wheel zoom and drag pan on an axis (cartesian, value / time / category). Double click resets */
    zoom?: boolean | {
        axis?: 'x' | 'y' | 'xy';
        minSpan?: number;
    };
    /** Elements in px drawn over the series (or a function returning them; it may also draw on info.ctx) */
    graphic?: CustomElement | CustomElement[] | ((info: CustomGraphicInfo) => CustomElement | CustomElement[] | null | void);
}
export type CustomEasing = 'linear' | 'cubicOut' | 'cubicInOut' | 'quadOut' | 'backOut' | 'elasticOut';
export type CustomEvent = 'hover' | 'click' | 'toggle' | 'zoom' | 'dragstart' | 'drag' | 'dragend';
export {};
