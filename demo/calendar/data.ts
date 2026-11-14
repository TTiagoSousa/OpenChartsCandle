/** Data and helpers for the calendar examples (generated or computed, see each comment). */
export { cells, seeded, select, withToolbar } from '../scatter/data';
export { choice } from '../line/data';
import { seeded } from '../scatter/data';

export const YEAR = 2026;

const pad = (n: number): string => String(n).padStart(2, '0');
export const key = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Every day of a year. */
export function yearDays(year: number): Date[] {
  const out: Date[] = [];
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = new Date(year, d.getMonth(), d.getDate() + 1)) out.push(d);
  return out;
}

/** Every day of a month (0-based). */
export function monthDays(year: number, month: number): Date[] {
  const n = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: n }, (_, i) => new Date(year, month, i + 1));
}

/**
 * Daily values of a year (generated): weekdays above weekends, a seasonal wave and noise, between 0 and `max`.
 * Like the number of commits or of steps per day.
 */
export function dailyValues(year: number, seed: number, max = 1000): [string, number][] {
  const rnd = seeded(seed);
  return yearDays(year).map((d) => {
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const season = 0.65 + 0.35 * Math.sin(((d.getMonth() - 2) / 12) * Math.PI * 2);
    return [key(d), Math.round(max * season * (weekend ? 0.45 : 0.8) * (0.35 + rnd() * 0.65))];
  });
}

// ---------------------------------------------------------------- moon (computed)

const SYNODIC = 29.530588853;
/** A known new moon: 6 Jan 2000 18:14 UTC */
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 86400000;

/** Moon age at a local time, 0–1 (0 = new, 0.5 = full). The mean moon: within about half a day. */
function ageAt(y: number, m: number, d: number, h: number): number {
  const days = new Date(y, m, d, h).getTime() / 86400000 - NEW_MOON;
  return (((days / SYNODIC) % 1) + 1) % 1;
}

/** Moon age at noon of a day, 0–1 (0 = new, 0.5 = full). */
export function moonAge(d: Date): number {
  return ageAt(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}

const PHASES = ['Lua nova', 'Quarto crescente', 'Lua cheia', 'Quarto minguante'];

/** Name of the main phase that happens during this day, or ''. */
export function moonPhase(d: Date): string {
  const a0 = ageAt(d.getFullYear(), d.getMonth(), d.getDate(), 0);
  const a1 = ageAt(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0);
  for (let i = 0; i < 4; i++) {
    // the phase is reached between the start and the end of the day (the age goes back to 0 after 1)
    const t = i / 4;
    if (a1 >= a0 ? t > a0 && t <= a1 : t > a0 || t <= a1) return PHASES[i];
  }
  return '';
}

/** Draw the moon of an age (0–1) as a lit disc, radius r. */
export function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, age: number, lit = '#f5e9b8', dark = 'rgba(120,123,134,0.35)'): void {
  ctx.save();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // lit part: half a disc plus (or minus) an ellipse of the terminator
  const waxing = age < 0.5;
  const k = Math.cos(age * Math.PI * 2); // 1 new → -1 full
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !waxing);
  ctx.ellipse(x, y, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === waxing);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- Portuguese public holidays (computed)

/** Easter Sunday (Gregorian calendar). */
function easter(y: number): Date {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

/** National holidays of Portugal: 'YYYY-MM-DD' → name. */
export function holidays(year: number): Map<string, string> {
  const fixed: [number, number, string][] = [
    [1, 1, 'Ano Novo'],
    [4, 25, 'Dia da Liberdade'],
    [5, 1, 'Dia do Trabalhador'],
    [6, 10, 'Dia de Portugal'],
    [8, 15, 'Assunção de Nossa Senhora'],
    [10, 5, 'Implantação da República'],
    [11, 1, 'Dia de Todos os Santos'],
    [12, 1, 'Restauração da Independência'],
    [12, 8, 'Imaculada Conceição'],
    [12, 25, 'Natal'],
  ];
  const out = new Map(fixed.map(([m, d, n]) => [key(new Date(year, m - 1, d)), n]));
  const e = easter(year);
  const at = (days: number): string => key(new Date(year, e.getMonth(), e.getDate() + days));
  out.set(at(-2), 'Sexta-feira Santa');
  out.set(at(0), 'Páscoa');
  out.set(at(60), 'Corpo de Deus');
  return out;
}

// ---------------------------------------------------------------- weather (generated)

export type Weather = 'sol' | 'nuvens' | 'chuva' | 'trovoada';

/** A month of weather in Lisbon (generated): type and max temperature per day. */
export function weatherMonth(year: number, month: number, seed: number): { date: string; weather: Weather; max: number }[] {
  const rnd = seeded(seed);
  let rainy = 0;
  return monthDays(year, month).map((d) => {
    // rainy spells last a few days
    rainy = rainy > 0 ? rainy - 1 : rnd() < 0.18 ? 1 + Math.floor(rnd() * 3) : 0;
    const r = rnd();
    const weather: Weather = rainy ? (r < 0.25 ? 'trovoada' : 'chuva') : r < 0.62 ? 'sol' : 'nuvens';
    const max = Math.round(21 - (rainy ? 4 : 0) + (rnd() - 0.5) * 5);
    return { date: key(d), weather, max };
  });
}

/** Simple weather icons drawn with paths, size s centered on x, y. */
export function drawWeather(ctx: CanvasRenderingContext2D, w: Weather, x: number, y: number, s: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  const cloud = (cx: number, cy: number, k: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx - k * 0.32, cy + k * 0.05, k * 0.26, 0, Math.PI * 2);
    ctx.arc(cx + k * 0.02, cy - k * 0.12, k * 0.34, 0, Math.PI * 2);
    ctx.arc(cx + k * 0.34, cy + k * 0.06, k * 0.24, 0, Math.PI * 2);
    ctx.rect(cx - k * 0.32, cy + k * 0.05, k * 0.66, k * 0.25);
    ctx.fill();
  };
  if (w === 'sol' || w === 'nuvens') {
    const sx = w === 'sol' ? x : x - s * 0.18;
    const sy = w === 'sol' ? y : y - s * 0.16;
    const r = s * (w === 'sol' ? 0.22 : 0.18);
    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = Math.max(1.2, s * 0.06);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * r * 1.4, sy + Math.sin(a) * r * 1.4);
      ctx.lineTo(sx + Math.cos(a) * r * 1.85, sy + Math.sin(a) * r * 1.85);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffca28';
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
    if (w === 'nuvens') cloud(x + s * 0.08, y + s * 0.08, s * 0.72, '#cfd8dc');
  } else {
    cloud(x, y - s * 0.12, s * 0.8, w === 'trovoada' ? '#78909c' : '#b0bec5');
    if (w === 'chuva') {
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = Math.max(1.2, s * 0.06);
      for (const dx of [-0.22, 0, 0.22]) {
        ctx.beginPath();
        ctx.moveTo(x + dx * s, y + s * 0.2);
        ctx.lineTo(x + dx * s - s * 0.06, y + s * 0.38);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.04, y + s * 0.12);
      ctx.lineTo(x - s * 0.12, y + s * 0.3);
      ctx.lineTo(x, y + s * 0.3);
      ctx.lineTo(x - s * 0.08, y + s * 0.46);
      ctx.lineTo(x + s * 0.14, y + s * 0.24);
      ctx.lineTo(x + s * 0.02, y + s * 0.24);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}
