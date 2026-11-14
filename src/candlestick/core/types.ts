import type { SessionHours } from './sessions';

export interface Bar {
  time: number; // unix seconds (start of bar)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** A point anchored to chart data: time (unix seconds, may be fractional/extrapolated) + price. */
export interface Point {
  time: number;
  price: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ChartType = 'bars' | 'candles' | 'hollow' | 'heikin' | 'line' | 'step' | 'area' | 'baseline';

export interface Timeframe {
  id: string;
  label: string;
  short: string;
  seconds: number;
}

/** Instrument metadata shown in the UI and used for price formatting. */
export interface SymbolInfo {
  /** Unique ticker, e.g. "BTCUSDT" */
  symbol: string;
  /** Number of decimals for prices, e.g. 2 */
  precision: number;
  /** Long description, e.g. "Bitcoin / TetherUS" */
  name?: string;
  /** Exchange or source label, e.g. "BINANCE" */
  exchange?: string;
  /** Free-form category used by the symbol search tabs: crypto, forex, stock, index, commodity… */
  type?: string;
  /** Quote currency shown next to prices in the details panel */
  currency?: string;
  /** Timeframes offered for this symbol in the Terminal, e.g. ['1', '5', '1h', '4h', '1D']. Default: all. */
  timeframes?: string[];
  /** IANA time zone of the exchange, e.g. 'America/New_York'. Used when the chart's `timezone` is 'exchange'. */
  timezone?: string;
  /**
   * Hours of the trading day in `timezone` (`{ pre: '0400-0930', regular: '0930-1600', post: '1600-2000' }`),
   * used by the session volume profile. Default: those of `exchange` (see `EXCHANGE_SESSIONS`).
   */
  sessions?: SessionHours;
}

/** Realtime summary used by the watchlist and details panel. */
export interface Quote {
  symbol: string;
  last: number;
  change: number;
  changePct: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export const TIMEFRAMES: Timeframe[] = [
  { id: '1', label: '1 minuto', short: '1m', seconds: 60 },
  { id: '3', label: '3 minutos', short: '3m', seconds: 180 },
  { id: '5', label: '5 minutos', short: '5m', seconds: 300 },
  { id: '15', label: '15 minutos', short: '15m', seconds: 900 },
  { id: '30', label: '30 minutos', short: '30m', seconds: 1800 },
  { id: '60', label: '1 hora', short: '1h', seconds: 3600 },
  { id: '120', label: '2 horas', short: '2h', seconds: 7200 },
  { id: '240', label: '4 horas', short: '4h', seconds: 14400 },
  { id: '1D', label: '1 dia', short: 'D', seconds: 86400 },
  { id: '1W', label: '1 semana', short: 'W', seconds: 604800 },
];

export function timeframeById(id: string): Timeframe {
  return TIMEFRAMES.find((t) => t.id === id) ?? TIMEFRAMES[0];
}

const UNITS: Record<string, { sec: number; one: string; many: string; short: string }> = {
  s: { sec: 1, one: 'segundo', many: 'segundos', short: 's' },
  m: { sec: 60, one: 'minuto', many: 'minutos', short: 'm' },
  h: { sec: 3600, one: 'hora', many: 'horas', short: 'h' },
  d: { sec: 86400, one: 'dia', many: 'dias', short: 'D' },
  w: { sec: 604800, one: 'semana', many: 'semanas', short: 'W' },
};

/**
 * Timeframe from a string: the ids of `TIMEFRAMES` ("1", "60", "1D") or a number with a unit
 * ("30s", "15m", "4h", "1D", "1W"). A number alone is minutes. Returns null when it can't be read.
 */
export function parseTimeframe(s: string): Timeframe | null {
  const known = TIMEFRAMES.find((t) => t.id === s);
  if (known) return known;
  const m = /^\s*(\d*)\s*(s|m|min|h|d|w)?\s*$/i.exec(s);
  if (!m || (!m[1] && !m[2])) return null;
  const n = m[1] ? parseInt(m[1], 10) : 1;
  const unit = UNITS[(m[2] ?? 'm').slice(0, 1).toLowerCase()];
  if (!n || !unit) return null;
  const seconds = n * unit.sec;
  const id = unit.sec === 1 ? `${n}S` : unit.sec < 86400 ? String(seconds / 60) : `${n}${unit.short}`;
  return (
    TIMEFRAMES.find((t) => t.id === id) ?? {
      id,
      label: `${n} ${n === 1 ? unit.one : unit.many}`,
      short: `${n}${unit.short}`,
      seconds,
    }
  );
}
