import { TimeZone, barDate } from './timezone';
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** Deterministic PRNG (mulberry32) with gaussian helper. */
export class Rng {
  private s: number;
  private spare: number | null = null;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  normal(): number {
    if (this.spare !== null) {
      const v = this.spare;
      this.spare = null;
      return v;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    v = this.next();
    const r = Math.sqrt(-2 * Math.log(u));
    this.spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  }
}

export function randomNormal(): number {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

export function roundTo(v: number, precision: number): number {
  const m = Math.pow(10, precision);
  return Math.round(v * m) / m;
}

export function formatPrice(p: number, precision: number): string {
  if (!isFinite(p)) return '—';
  return p.toFixed(precision);
}

export function formatNumber(v: number, precision = 2): string {
  if (!isFinite(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision });
}

export function formatVolume(v: number): string {
  if (!isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(a < 10 ? 2 : 0);
}

export function niceStep(raw: number): number {
  if (raw <= 0 || !isFinite(raw)) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = Math.pow(10, exp);
  const f = raw / base;
  let n: number;
  if (f <= 1) n = 1;
  else if (f <= 2) n = 2;
  else if (f <= 2.5) n = 2.5;
  else if (f <= 5) n = 5;
  else n = 10;
  return n * base;
}

/** Apply alpha to '#rgb', '#rrggbb', '#rrggbbaa' or 'rgb(a)(...)' colors. */
export function withAlpha(color: string, alpha: number): string {
  const { r, g, b } = parseColor(color);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  const c = color.trim();
  if (c.startsWith('#')) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(',').map((x) => parseFloat(x));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  return { r: 41, g: 98, b: 255, a: 1 };
}

export function colorAlpha(color: string): number {
  return parseColor(color).a;
}

export function toHex(color: string): string {
  const { r, g, b } = parseColor(color);
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

export function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Distance to an infinite line / ray depending on extension flags. */
export function distToLine(
  px: number, py: number, x1: number, y1: number, x2: number, y2: number, extL: boolean, extR: boolean,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  if (!extL) t = Math.max(t, 0);
  if (!extR) t = Math.min(t, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

let uidCounter = 0;
export function uid(prefix = 'id'): string {
  uidCounter++;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export const pad2 = (n: number): string => (n < 10 ? '0' + n : '' + n);

export const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Date and time for the crosshair label, trade lists… Intraday in `tz` (default: the browser's time);
 * daily and longer bars (`tfSeconds` >= 1 day) only the calendar date of the bar.
 */
export function formatCrosshairTime(t: number, tfSeconds: number, tz?: TimeZone): string {
  const d = tfSeconds >= 86400 ? barDate(t) : (tz ?? localZone).wall(t);
  const date = `${WEEKDAYS[d.getUTCDay()]} ${pad2(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
  if (tfSeconds >= 86400) return date;
  return `${date}  ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

const localZone = new TimeZone();

export function formatDuration(seconds: number): string {
  const s = Math.abs(Math.round(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || parts.length === 0) parts.push(`${m}m`);
  return parts.join(' ');
}

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${pad2(h)}h`;
  if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
  return `${pad2(m)}:${pad2(sec)}`;
}

export class Emitter<T = void> {
  private handlers = new Set<(v: T) => void>();
  on(fn: (v: T) => void): () => void {
    this.handlers.add(fn);
    return () => this.handlers.delete(fn);
  }
  emit(v: T): void {
    this.handlers.forEach((h) => h(v));
  }
  /** Number of listeners. */
  get size(): number {
    return this.handlers.size;
  }
}

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function storageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/** Snap pixel coordinate so that a line of the given width renders crisp. */
export function crisp(v: number, lineWidth: number, dpr: number): number {
  const px = Math.round(v * dpr);
  const w = Math.max(1, Math.round(lineWidth * dpr));
  return (w % 2 === 1 ? px + 0.5 : px) / dpr;
}
