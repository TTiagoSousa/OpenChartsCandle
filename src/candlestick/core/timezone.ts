/**
 * Time zone of the time axis and the crosshair:
 * - `'local'`: the browser's time (default);
 * - `'UTC'`;
 * - an IANA name: `'Europe/Lisbon'`, `'America/New_York'`, `'Asia/Tokyo'`…;
 * - `'exchange'`: the `timezone` of the symbol (`SymbolInfo.timezone`), UTC if it has none.
 */
export type TimeZoneId = 'local' | 'UTC' | 'exchange' | (string & {});

/** Time zones offered in the Terminal's clock menu. */
export const TIMEZONES: { id: TimeZoneId; label: string }[] = [
  { id: 'local', label: 'Hora do browser' },
  { id: 'exchange', label: 'Bolsa do símbolo' },
  { id: 'UTC', label: 'UTC' },
  { id: 'Europe/Lisbon', label: 'Lisboa' },
  { id: 'Europe/London', label: 'Londres' },
  { id: 'Europe/Madrid', label: 'Madrid' },
  { id: 'Europe/Berlin', label: 'Berlim / Frankfurt' },
  { id: 'Europe/Moscow', label: 'Moscovo' },
  { id: 'America/Sao_Paulo', label: 'São Paulo' },
  { id: 'America/New_York', label: 'Nova Iorque' },
  { id: 'America/Chicago', label: 'Chicago' },
  { id: 'America/Los_Angeles', label: 'Los Angeles' },
  { id: 'Asia/Dubai', label: 'Dubai' },
  { id: 'Asia/Kolkata', label: 'Bombaim' },
  { id: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { id: 'Asia/Shanghai', label: 'Xangai' },
  { id: 'Asia/Tokyo', label: 'Tóquio' },
  { id: 'Australia/Sydney', label: 'Sydney' },
];

/** Throws a RangeError for a name the browser doesn't know. */
export function checkTimeZone(id: string): void {
  if (id === 'local' || id === 'UTC' || id === 'exchange') return;
  new Intl.DateTimeFormat('en-US', { timeZone: id });
}

/** Offset of a resolved zone ('local', 'UTC' or IANA) at an instant, with the wall clock via `getUTC*`. */
export class TimeZone {
  private dtf: Intl.DateTimeFormat | null = null;
  /** offset (s) per quarter of an hour: zones change offset on quarter-hour boundaries */
  private cache = new Map<number, number>();

  constructor(readonly id: string = 'local') {
    if (id !== 'local' && id !== 'UTC') {
      this.dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: id,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      });
    }
  }

  /** Seconds to add to UTC to get the wall-clock time at instant `t` (unix seconds). */
  offset(t: number): number {
    if (this.id === 'UTC') return 0;
    if (!this.dtf) return -new Date(t * 1000).getTimezoneOffset() * 60;
    const key = Math.floor(t / 900);
    let o = this.cache.get(key);
    if (o === undefined) {
      const ms = key * 900 * 1000;
      const p: Record<string, number> = {};
      for (const x of this.dtf.formatToParts(ms)) if (x.type !== 'literal') p[x.type] = Number(x.value);
      o = (Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - ms) / 1000;
      if (this.cache.size > 20000) this.cache.clear();
      this.cache.set(key, o);
    }
    return o;
  }

  /** A Date whose `getUTC*` fields are the wall-clock time in this zone at instant `t`. */
  wall(t: number): Date {
    return new Date((t + this.offset(t)) * 1000);
  }

  /** "UTC+1", "UTC-5", "UTC+5:30" at instant `t`. */
  label(t = Date.now() / 1000): string {
    const o = Math.round(this.offset(t) / 60);
    const h = Math.trunc(Math.abs(o) / 60);
    const m = Math.abs(o) % 60;
    return `UTC${o < 0 ? '-' : '+'}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
  }
}

/** The instant (unix s) of a wall-clock date in a zone, e.g. Jan 1st 00:00 in Lisbon. */
export function zonedTime(tz: TimeZone, year: number, month: number, day: number, hour = 0, minute = 0): number {
  const guess = Date.UTC(year, month, day, hour, minute) / 1000;
  let t = guess - tz.offset(guess);
  t = guess - tz.offset(t); // second pass handles a DST change between the guess and the answer
  return t;
}

/** Dates of daily and longer bars: the calendar day of the bar, whatever the zone (bars start at that day's midnight in their market). */
export function barDate(t: number): Date {
  return new Date((t + 43200) * 1000);
}
