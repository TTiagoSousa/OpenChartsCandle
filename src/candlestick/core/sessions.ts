import { TimeZone } from './timezone';
import type { Bar, SymbolInfo } from './types';

/**
 * Hours of the parts of a trading day, in the exchange's time zone: `'HHMM-HHMM'`, several joined by a comma
 * (`'0900-1130,1230-1530'`, a lunch break). A range can cross midnight (`'1700-0830'`: it belongs to the next
 * day's session); equal ends are 24 hours from that time (`'1700-1700'`), `'0000-2400'` the whole day.
 */
export interface SessionHours {
  /** Pré-mercado */
  pre?: string;
  /** Mercado (the regular session) */
  regular: string;
  /** Pós-mercado */
  post?: string;
  /** Noturno (overnight) */
  overnight?: string;
}

/** An exchange: its time zone and session hours. `aliases` are other `SymbolInfo.exchange` names it answers to. */
export interface ExchangeSessions extends SessionHours {
  id: string;
  label: string;
  timezone: string;
  aliases?: string[];
}

export type SessionPart = 'pre' | 'regular' | 'post' | 'overnight';

/**
 * Session hours of the main exchanges (indicative: holidays and half days are not known). Add more with
 * `EXCHANGE_SESSIONS.push(...)`, or give a symbol its own with `SymbolInfo.sessions`.
 */
export const EXCHANGE_SESSIONS: ExchangeSessions[] = [
  {
    id: 'NYSE',
    label: 'NYSE / NASDAQ (EUA)',
    aliases: ['NASDAQ', 'AMEX', 'ARCA', 'NYSEARCA', 'BATS', 'CBOE', 'OTC', 'US'],
    timezone: 'America/New_York',
    overnight: '2000-0400',
    pre: '0400-0930',
    regular: '0930-1600',
    post: '1600-2000',
  },
  {
    id: 'CME',
    label: 'CME / CBOT / NYMEX / COMEX (futuros)',
    aliases: ['CBOT', 'NYMEX', 'COMEX', 'CME_MINI', 'GLOBEX'],
    timezone: 'America/Chicago',
    overnight: '1700-0830',
    regular: '0830-1500',
    post: '1500-1600',
  },
  {
    id: 'B3',
    label: 'B3 (Brasil)',
    aliases: ['BMFBOVESPA', 'BOVESPA', 'BVMF'],
    timezone: 'America/Sao_Paulo',
    pre: '0945-1000',
    regular: '1000-1755',
    post: '1755-1800',
  },
  {
    id: 'EURONEXT',
    label: 'Euronext (Lisboa, Paris, Amesterdão…)',
    aliases: ['ENXTLS', 'ENXTPA', 'ENXTAM', 'ENXTBR', 'XLIS', 'XPAR', 'XAMS', 'EURONEXT_LISBON'],
    timezone: 'Europe/Paris',
    pre: '0715-0900',
    regular: '0900-1730',
    post: '1730-1740',
  },
  {
    id: 'XETRA',
    label: 'Xetra / Frankfurt',
    aliases: ['XETR', 'FWB', 'FRA'],
    timezone: 'Europe/Berlin',
    pre: '0800-0900',
    regular: '0900-1730',
    post: '1730-2200',
  },
  {
    id: 'LSE',
    label: 'Londres (LSE)',
    aliases: ['XLON'],
    timezone: 'Europe/London',
    pre: '0750-0800',
    regular: '0800-1630',
    post: '1630-1635',
  },
  {
    id: 'TSE',
    label: 'Tóquio (TSE)',
    aliases: ['TYO', 'JPX', 'XTKS'],
    timezone: 'Asia/Tokyo',
    regular: '0900-1130,1230-1530',
  },
  {
    id: 'HKEX',
    label: 'Hong Kong (HKEX)',
    aliases: ['HKG', 'XHKG'],
    timezone: 'Asia/Hong_Kong',
    pre: '0900-0930',
    regular: '0930-1200,1300-1600',
    post: '1600-1610',
  },
  {
    id: 'FOREX',
    label: 'Forex (dia das 17:00 de Nova Iorque)',
    aliases: ['FX', 'FX_IDC', 'OANDA', 'FXCM', 'SAXO'],
    timezone: 'America/New_York',
    regular: '1700-1700',
  },
  {
    id: 'CRYPTO',
    label: 'Cripto (24h, UTC)',
    aliases: ['BINANCE', 'COINBASE', 'BYBIT', 'KRAKEN', 'BITSTAMP', 'OKX', 'BITFINEX', 'KUCOIN'],
    timezone: 'UTC',
    regular: '0000-2400',
  },
];

/** `'0930-1600'` or `'0900-1130,1230-1530'` → minute ranges ([570, 960]); null when it can't be read. */
export function parseSessionRanges(s: string): [number, number][] | null {
  const out: [number, number][] = [];
  for (const part of String(s).split(',')) {
    const m = /^\s*(\d{2}):?(\d{2})\s*-\s*(\d{2}):?(\d{2})\s*$/.exec(part);
    if (!m) return null;
    const a = Number(m[1]) * 60 + Number(m[2]);
    const b = Number(m[3]) * 60 + Number(m[4]);
    if (Number(m[2]) > 59 || Number(m[4]) > 59 || a > 1439 || b > 1440) return null;
    out.push([a, b]);
  }
  return out.length ? out : null;
}

/** The exchange with this id or alias (any case). */
export function findExchange(name: string | undefined): ExchangeSessions | undefined {
  if (!name) return undefined;
  const n = name.toUpperCase();
  return EXCHANGE_SESSIONS.find((e) => e.id === n || e.aliases?.includes(n));
}

/**
 * Session hours and time zone for a symbol: an `exchange` id chosen in the settings, else the symbol's own
 * `sessions`, else its `exchange`, else crypto / forex by its `type`, else the whole day in its `timezone`.
 */
export function resolveSessions(exchange: string, symbol?: SymbolInfo): { hours: SessionHours; timezone: string } {
  const chosen = findExchange(exchange);
  if (chosen) return { hours: chosen, timezone: chosen.timezone };
  if (symbol?.sessions) return { hours: symbol.sessions, timezone: symbol.timezone || 'UTC' };
  const e = findExchange(symbol?.exchange) ?? (symbol?.type === 'crypto' ? findExchange('CRYPTO') : symbol?.type === 'forex' ? findExchange('FOREX') : undefined);
  if (e) return { hours: e, timezone: symbol?.timezone || e.timezone };
  return { hours: { regular: '0000-2400' }, timezone: symbol?.timezone || 'UTC' };
}

/** One session of bars: `from`..`to` (indices), the trading day it belongs to and its part. */
export interface SessionSpan {
  from: number;
  to: number;
  day: number;
  part: SessionPart | 'custom' | 'all';
}

/** The parts used to split: each with its minute ranges. */
export type SessionFilter = { part: SessionPart | 'custom'; ranges: [number, number][] }[];

/** Which of the parts a minute of the day is in, and on which trading day (+1: a range that crossed midnight). */
function partOf(filter: SessionFilter, m: number): { k: number; next: boolean } | null {
  for (let k = 0; k < filter.length; k++) {
    for (const [s, e] of filter[k].ranges) {
      if (s < e) {
        if (m >= s && m < e) return { k, next: false };
      } else if (m >= s) return { k, next: s > 0 };
      else if (m < e) return { k, next: false };
    }
  }
  return null;
}

/**
 * Split bars `start`.. into sessions: consecutive bars in the same part of the same trading day (`merge`: in
 * any of the parts). Bars outside the parts are left out. On daily and longer bars each bar is a session.
 */
export function splitSessions(bars: Bar[], start: number, tf: number, tz: TimeZone, filter: SessionFilter, merge: boolean): SessionSpan[] {
  const out: SessionSpan[] = [];
  let cur: SessionSpan | null = null;
  for (let i = Math.max(0, start); i < bars.length; i++) {
    const t = bars[i].time;
    let day: number;
    let part: SessionSpan['part'];
    if (tf >= 86400) {
      day = Math.floor((t + 43200) / 86400);
      part = merge ? 'all' : filter[0]?.part ?? 'regular';
    } else {
      const wall = t + tz.offset(t);
      const d = Math.floor(wall / 86400);
      const hit = partOf(filter, Math.floor((wall - d * 86400) / 60));
      if (!hit) {
        cur = null;
        continue;
      }
      day = d + (hit.next ? 1 : 0);
      part = merge ? 'all' : filter[hit.k].part;
    }
    if (cur && cur.day === day && cur.part === part && cur.to === i - 1) cur.to = i;
    else {
      cur = { from: i, to: i, day, part };
      out.push(cur);
    }
  }
  return out;
}
