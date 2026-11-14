export interface GaugeZone {
    from: number;
    to: number;
    color: string;
    /** Shown in the tooltip and as the value color label */
    label?: string;
}
export interface GaugeMarker {
    value: number;
    label?: string;
    color?: string;
}
/** An extra needle (several values on the same dial: clock hands, Good / Better / Perfect…) */
export interface GaugePointer {
    value: number;
    label?: string;
    color?: string;
    shape?: 'classic' | 'line' | 'arrow';
    /** px */
    width?: number;
    /** Fraction of the radius. Default 0.82 */
    length?: number;
}
/** A concentric progress ring (several values as rings, outer to inner) */
export interface GaugeRing {
    value: number;
    label?: string;
    color?: string;
}
export interface GaugeTheme {
    background: string;
    text: string;
    muted: string;
    /** Empty track */
    track: string;
    /** Needle and hub */
    needle: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
    font: string;
}
export interface GaugeOptions {
    value?: number;
    min?: number;
    max?: number;
    /** Preset: 'speedometer' (240°), 'semi' (180°), 'full' (360° ring), or custom angles. Default 'speedometer' */
    shape?: 'speedometer' | 'semi' | 'full';
    /** Custom start / end angles in degrees (0 = top, clockwise). Override `shape` */
    startAngle?: number;
    endAngle?: number;
    /** Arc thickness: px or fraction of the radius (0–1). Default 0.16 */
    thickness?: number;
    /** Rounded arc ends. Default true */
    rounded?: boolean;
    padding?: number;
    /** Colored zones along the track (e.g. green / yellow / red) */
    zones?: GaugeZone[];
    /** Gradient along the track instead of zones (2+ colors) */
    gradient?: string[];
    /** Fill the track from min to the value (progress). Default: true without needle, false with zones */
    progress?: boolean | {
        color?: string;
    };
    /** Space between zones, degrees. Default 1.2 */
    zoneGap?: number;
    /** color: 'zone' paints the needle with the color of the zone it points at */
    needle?: boolean | {
        show?: boolean;
        shape?: 'classic' | 'line' | 'arrow';
        color?: string | 'zone';
        width?: number;
        length?: number;
        hub?: boolean;
    };
    /** Several needles instead of one (each with its value, color and label). The values are listed under the dial */
    pointers?: GaugePointer[];
    /** List the pointer labels and values under the dial. Default true */
    pointerValues?: boolean;
    /** Several values as concentric progress rings (outer first); the labels and values are listed in the center */
    rings?: GaugeRing[];
    ticks?: {
        show?: boolean;
        /** Major ticks count. Default 6 */
        major?: number;
        /** Minor ticks between majors. Default 4 */
        minor?: number;
        labels?: boolean;
        format?: (v: number) => string;
        /** 'inside' or 'outside' the arc, or 'on' it (across the colored band). Default 'inside' */
        position?: 'inside' | 'outside' | 'on';
        color?: string;
    };
    /** Title under the value */
    title?: string;
    /** Unit after the value (e.g. 'km/h', '%') */
    unit?: string;
    valueFormatter?: (v: number) => string;
    /** Color the value with the color of its zone. Default true */
    valueColorByZone?: boolean;
    /** Show min / max under the arc ends. Default true for speedometer/semi */
    showMinMax?: boolean;
    /** Font size of the value, px or 'auto'. Default 'auto' */
    valueSize?: number | 'auto';
    markers?: GaugeMarker[];
    /** Write each zone's label on the dial, in the middle of the zone (e.g. 'Grade A'…) */
    zoneLabels?: boolean | {
        color?: string;
        fontSize?: number;
    };
    /** A second scale inside the first, on the same arc (e.g. hPa outside, mmHg inside) */
    secondaryScale?: {
        min: number;
        max: number;
        major?: number;
        minor?: number;
        format?: (v: number) => string;
        color?: string;
        label?: string;
    };
    tooltip?: boolean | {
        show?: boolean;
        formatter?: (ctx: {
            value: number;
            zone: GaugeZone | null;
            hovered: GaugeZone | GaugeMarker | null;
        }) => string;
    };
    background?: string;
    theme?: 'dark' | 'light' | Partial<GaugeTheme>;
    /** Needle animation. 'spring' overshoots a little. Default 'spring' */
    animation?: boolean | {
        duration?: number;
        easing?: 'spring' | 'smooth' | 'linear';
    };
}
export type GaugeEvent = 'change' | 'zone';
