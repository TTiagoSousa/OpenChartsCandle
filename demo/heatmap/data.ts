/** Data and helpers for the heatmap examples (generated, see each comment). */
export { seeded, select, withToolbar } from '../scatter/data';
import { gauss, seeded } from '../scatter/data';

/** Hours of the day, as in a punch card. */
export const HOURS = ['0h', '1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h', '23h'];
export const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

/**
 * Activity per weekday and hour (generated): `[hour, weekday, value]`, busier in working hours and on
 * weekdays, between 0 and 10.
 */
export function punchCard(seed: number): [number, number, number][] {
  const rnd = seeded(seed);
  const out: [number, number, number][] = [];
  for (let d = 0; d < 7; d++)
    for (let h = 0; h < 24; h++) {
      const day = Math.exp(-((h - 11) ** 2) / 18) + 0.6 * Math.exp(-((h - 16) ** 2) / 10);
      const k = d < 5 ? 1 : 0.45;
      out.push([h, d, Math.round(Math.min(10, (day * 8 * k + rnd() * 2.5) * (h < 6 ? 0.3 : 1)))]);
    }
  return out;
}

/** Smooth 2D noise (generated): a few waves and bumps, about 0–1. One value per cell, `[x, y, value]`. */
export function noiseGrid(nx: number, ny: number, seed: number): [number, number, number][] {
  const rnd = seeded(seed);
  const bumps = Array.from({ length: 7 }, () => [rnd() * nx, rnd() * ny, 6 + rnd() * 18, rnd() - 0.35]);
  const out: [number, number, number][] = [];
  for (let y = 0; y < ny; y++)
    for (let x = 0; x < nx; x++) {
      let v = 0.5 + 0.18 * Math.sin(x / 13 + Math.cos(y / 17)) + 0.12 * Math.cos(y / 9 - x / 31);
      for (const [bx, by, r, a] of bumps) v += a * 0.5 * Math.exp(-((x - bx) ** 2 + (y - by) ** 2) / (2 * r * r));
      out.push([x, y, Math.round(Math.min(1, Math.max(0, v + (rnd() - 0.5) * 0.04)) * 1000) / 1000]);
    }
  return out;
}

/** Assets of the correlation matrix and their group (crypto, big tech, safe havens). */
export const ASSETS: [name: string, group: 'cripto' | 'tech' | 'refugio'][] = [
  ['BTC', 'cripto'],
  ['ETH', 'cripto'],
  ['SOL', 'cripto'],
  ['AAPL', 'tech'],
  ['MSFT', 'tech'],
  ['NVDA', 'tech'],
  ['Ouro', 'refugio'],
  ['EUR/USD', 'refugio'],
];

/**
 * Daily returns of the assets (generated): a market factor, a factor per group and noise, so assets of the
 * same group move together and safe havens a bit against the market.
 */
export function assetReturns(days: number, seed: number): number[][] {
  const rnd = seeded(seed);
  const market = Array.from({ length: days }, () => gauss(rnd));
  const groups = { cripto: market.map(() => gauss(rnd)), tech: market.map(() => gauss(rnd)), refugio: market.map(() => gauss(rnd)) };
  const beta = { cripto: 0.5, tech: 0.7, refugio: -0.25 };
  return ASSETS.map(([, g]) => {
    const own = 0.5 + rnd() * 0.6;
    return market.map((m, t) => (beta[g] * m + own * groups[g][t] + 0.7 * gauss(rnd)) * 0.01);
  });
}
