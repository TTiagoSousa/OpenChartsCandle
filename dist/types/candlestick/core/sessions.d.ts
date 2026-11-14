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
export declare const EXCHANGE_SESSIONS: ExchangeSessions[];
/** `'0930-1600'` or `'0900-1130,1230-1530'` → minute ranges ([570, 960]); null when it can't be read. */
export declare function parseSessionRanges(s: string): [number, number][] | null;
/** The exchange with this id or alias (any case). */
export declare function findExchange(name: string | undefined): ExchangeSessions | undefined;
/**
 * Session hours and time zone for a symbol: an `exchange` id chosen in the settings, else the symbol's own
 * `sessions`, else its `exchange`, else crypto / forex by its `type`, else the whole day in its `timezone`.
 */
export declare function resolveSessions(exchange: string, symbol?: SymbolInfo): {
    hours: SessionHours;
    timezone: string;
};
/** One session of bars: `from`..`to` (indices), the trading day it belongs to and its part. */
export interface SessionSpan {
    from: number;
    to: number;
    day: number;
    part: SessionPart | 'custom' | 'all';
}
/** The parts used to split: each with its minute ranges. */
export type SessionFilter = {
    part: SessionPart | 'custom';
    ranges: [number, number][];
}[];
/**
 * Split bars `start`.. into sessions: consecutive bars in the same part of the same trading day (`merge`: in
 * any of the parts). Bars outside the parts are left out. On daily and longer bars each bar is a session.
 */
export declare function splitSessions(bars: Bar[], start: number, tf: number, tz: TimeZone, filter: SessionFilter, merge: boolean): SessionSpan[];
