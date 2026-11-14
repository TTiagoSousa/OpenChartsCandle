/**
 * Time zone of the time axis and the crosshair:
 * - `'local'`: the browser's time (default);
 * - `'UTC'`;
 * - an IANA name: `'Europe/Lisbon'`, `'America/New_York'`, `'Asia/Tokyo'`…;
 * - `'exchange'`: the `timezone` of the symbol (`SymbolInfo.timezone`), UTC if it has none.
 */
export type TimeZoneId = 'local' | 'UTC' | 'exchange' | (string & {});
/** Time zones offered in the Terminal's clock menu. */
export declare const TIMEZONES: {
    id: TimeZoneId;
    label: string;
}[];
/** Throws a RangeError for a name the browser doesn't know. */
export declare function checkTimeZone(id: string): void;
/** Offset of a resolved zone ('local', 'UTC' or IANA) at an instant, with the wall clock via `getUTC*`. */
export declare class TimeZone {
    readonly id: string;
    private dtf;
    /** offset (s) per quarter of an hour: zones change offset on quarter-hour boundaries */
    private cache;
    constructor(id?: string);
    /** Seconds to add to UTC to get the wall-clock time at instant `t` (unix seconds). */
    offset(t: number): number;
    /** A Date whose `getUTC*` fields are the wall-clock time in this zone at instant `t`. */
    wall(t: number): Date;
    /** "UTC+1", "UTC-5", "UTC+5:30" at instant `t`. */
    label(t?: number): string;
}
/** The instant (unix s) of a wall-clock date in a zone, e.g. Jan 1st 00:00 in Lisbon. */
export declare function zonedTime(tz: TimeZone, year: number, month: number, day: number, hour?: number, minute?: number): number;
/** Dates of daily and longer bars: the calendar day of the bar, whatever the zone (bars start at that day's midnight in their market). */
export declare function barDate(t: number): Date;
