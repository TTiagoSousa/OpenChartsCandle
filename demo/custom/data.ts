/** Data for the custom examples (made up or generated for the demo, see each comment). */
export { choice, h } from '../line/data';
export { seeded, gauss, select, withToolbar } from '../scatter/data';
export { treemapGrid, SECTORS } from '../treemap/data';
import { gauss, seeded } from '../scatter/data';

export const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const WEEKDAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** Daily returns (%) of a made-up index: a bit of fat tails. */
export function dailyReturns(n = 500, seed = 7): number[] {
  const rnd = seeded(seed);
  return Array.from({ length: n }, () => {
    const g = gauss(rnd);
    return +(g * (rnd() < 0.08 ? 2.4 : 0.9) + 0.04).toFixed(3);
  });
}

/** Monthly P&L of a trading desk, k€: [month, profit]. */
export function monthlyPnl(): [string, number][] {
  const v = [42, -18, 65, 31, -44, 12, 88, -9, 24, -61, 57, 73];
  return MONTHS_PT.map((m, i) => [m, v[i]]);
}

/** Analyst estimates: [EPS estimate, price target, EPS low, EPS high, target low, target high, ticker]. */
export function estimates(): [number, number, number, number, number, number, string][] {
  const rnd = seeded(31);
  const tickers = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'JPM', 'V', 'XOM', 'KO', 'PEP', 'NKE', 'DIS'];
  return tickers.map((t) => {
    const eps = 2 + rnd() * 10;
    const pt = 60 + eps * (14 + rnd() * 18);
    return [+eps.toFixed(2), Math.round(pt), +(eps * (0.8 + rnd() * 0.1)).toFixed(2), +(eps * (1.1 + rnd() * 0.15)).toFixed(2), Math.round(pt * (0.75 + rnd() * 0.1)), Math.round(pt * (1.12 + rnd() * 0.2)), t];
  });
}

/** Mean daily volatility by sector with a band: [sector, mean, low, high] (%). */
export function sectorVolatility(): [string, number, number, number][] {
  return [
    ['Tecnologia', 2.1, 1.4, 3.2],
    ['Energia', 2.4, 1.6, 3.6],
    ['Financeiro', 1.6, 1.1, 2.4],
    ['Saúde', 1.2, 0.8, 1.8],
    ['Consumo', 1.4, 0.9, 2.1],
    ['Utilities', 0.9, 0.6, 1.3],
    ['Imobiliário', 1.7, 1.1, 2.6],
  ];
}

/** Profile of a web page load: [lane, start ms, end ms, name, kind]. */
export function profileEvents(): [number, number, number, string, string][] {
  const rnd = seeded(5);
  const lanes = 4;
  const kinds = ['Rede', 'Script', 'Render', 'Pintura'];
  const out: [number, number, number, string, string][] = [];
  for (let l = 0; l < lanes; l++) {
    let t = rnd() * 20;
    while (t < 1800) {
      const kind = kinds[Math.floor(rnd() * kinds.length)];
      const d = 8 + rnd() * (kind === 'Rede' ? 160 : 70);
      out.push([l, +t.toFixed(1), +(t + d).toFixed(1), `${kind.toLowerCase()}#${out.length}`, kind]);
      t += d + rnd() * 40;
    }
  }
  return out;
}

/** Returns (%) by weekday over 8 weeks: [weekday index, week index, return]. */
export function weekdayReturns(): [number, number, number][] {
  const rnd = seeded(13);
  const bias = [-0.12, 0.05, 0.1, 0.02, 0.18];
  const out: [number, number, number][] = [];
  for (let d = 0; d < 5; d++) for (let w = 0; w < 8; w++) out.push([d, w, +(bias[d] + gauss(rnd) * 0.45 + Math.sin(w / 2) * 0.1).toFixed(2)]);
  return out;
}

/** Flights at an airport's gates on one day: [gate, start ms, end ms, flight, destination]. */
export function flights(): [string, number, number, string, string][] {
  const rnd = seeded(41);
  const gates = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];
  const dest = ['Madrid', 'Paris', 'Londres', 'Funchal', 'Ponta Delgada', 'Roma', 'Berlim', 'Amesterdão', 'Faro', 'Genebra'];
  const day = new Date(2026, 9, 19).getTime();
  const out: [string, number, number, string, string][] = [];
  for (const g of gates) {
    let t = day + (6 + rnd() * 1.5) * 36e5;
    while (t < day + 21 * 36e5) {
      const d = (40 + rnd() * 70) * 6e4;
      out.push([g, t, t + d, `TP${1000 + Math.floor(rnd() * 900)}`, dest[Math.floor(rnd() * dest.length)]]);
      t += d + (15 + rnd() * 80) * 6e4;
    }
  }
  return out;
}

/** Trades by hour × weekday: [hour, weekday, count]. */
export function tradesByHour(): [number, number, number][] {
  const rnd = seeded(3);
  const out: [number, number, number][] = [];
  for (let d = 0; d < 7; d++)
    for (let hr = 0; hr < 24; hr++) {
      const open = d < 5 && hr >= 8 && hr <= 16;
      const base = open ? 60 + 40 * Math.sin(((hr - 8) / 8) * Math.PI) : d < 5 ? 8 : 3;
      out.push([hr, d, Math.round(base * (0.7 + rnd() * 0.6))]);
    }
  return out;
}

export interface FlameNode {
  name: string;
  value: number;
  children?: FlameNode[];
}

/** CPU profile of a backtest (ms per function). */
export function flameTree(): FlameNode {
  return {
    name: 'main',
    value: 1000,
    children: [
      {
        name: 'loadData',
        value: 260,
        children: [
          { name: 'readCsv', value: 150, children: [{ name: 'parseLine', value: 110 }] },
          { name: 'fetchQuotes', value: 90, children: [{ name: 'http.get', value: 70 }] },
        ],
      },
      {
        name: 'runBacktest',
        value: 610,
        children: [
          {
            name: 'computeSignals',
            value: 330,
            children: [
              { name: 'sma', value: 90 },
              { name: 'rsi', value: 120, children: [{ name: 'ema', value: 70 }] },
              { name: 'macd', value: 100, children: [{ name: 'ema', value: 80 }] },
            ],
          },
          { name: 'executeOrders', value: 180, children: [{ name: 'matchBook', value: 120, children: [{ name: 'sortBids', value: 60 }] }] },
          { name: 'riskCheck', value: 80 },
        ],
      },
      { name: 'writeReport', value: 110, children: [{ name: 'renderPdf', value: 80 }] },
    ],
  };
}

/** Wind over 48 hours at a port: [time ms, speed (nós), direction (graus, de onde sopra)]. */
export function windSeries(): [number, number, number][] {
  const rnd = seeded(17);
  const t0 = new Date(2026, 9, 18).getTime();
  return Array.from({ length: 33 }, (_, i) => {
    const sp = 6 + 22 * Math.abs(Math.sin(i / 7)) + rnd() * 6;
    const dir = (300 + i * 4 + rnd() * 30) % 360;
    return [t0 + i * 1.5 * 36e5, +sp.toFixed(1), Math.round(dir)];
  });
}

/** Two clouds of trades: [volatility %, return %]. */
export function hexPoints(): [number, number][] {
  const rnd = seeded(9);
  const out: [number, number][] = [];
  for (let i = 0; i < 1400; i++) {
    const a = rnd() < 0.6;
    out.push([+(a ? 18 + gauss(rnd) * 5 : 34 + gauss(rnd) * 6).toFixed(2), +(a ? 6 + gauss(rnd) * 6 : -2 + gauss(rnd) * 9).toFixed(2)]);
  }
  return out;
}

/** Weather of a month in Lisbon: [day, kind, max °C]. kind: sol, nuvens, chuva, trovoada. */
export function monthWeather(year = 2026, month = 9): [number, string, number][] {
  const rnd = seeded(year * 13 + month);
  const kinds = ['sol', 'sol', 'nuvens', 'chuva', 'sol', 'nuvens', 'trovoada'];
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => [i + 1, kinds[Math.floor(rnd() * kinds.length)], Math.round(17 + rnd() * 9)]);
}

/** Moon phase 0–1 (0 = nova, 0.5 = cheia) of a date. */
export function moonPhase(d: Date): number {
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const p = ((d.getTime() - ref) / 864e5 / 29.530588853) % 1;
  return p < 0 ? p + 1 : p;
}

/** A wind field: [lon, lat, u, v]. */
export function windField(): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  for (let x = -12; x <= 2; x += 1)
    for (let y = 35; y <= 45; y += 1) {
      const cx = -5;
      const cy = 40;
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy) + 1;
      // a low-pressure swirl plus a westerly flow
      out.push([x, y, +(4 - (dy / d) * 9).toFixed(2), +((dx / d) * 9 + Math.sin(x / 2) * 1.5).toFixed(2)]);
    }
  return out;
}

/** Parties of a parliament: [name, seats, color]. */
export function parliament(): [string, number, string][] {
  return [
    ['Esquerda', 12, '#c62828'],
    ['Verdes', 14, '#2e7d32'],
    ['Socialistas', 78, '#e91e63'],
    ['Liberais', 25, '#00acc1'],
    ['Centro', 32, '#ff9800'],
    ['Conservadores', 60, '#1e88e5'],
    ['Direita', 9, '#3949ab'],
  ];
}

/** Rough outline of mainland Portugal (lon / lat pairs, simplified by hand). */
export const PORTUGAL: [number, number][] = [
  [-8.87, 41.87], [-8.75, 42.03], [-8.2, 42.15], [-8.08, 41.95], [-7.65, 41.98], [-7.42, 41.82], [-7.05, 41.95], [-6.6, 41.95],
  [-6.2, 41.6], [-6.5, 41.25], [-6.95, 40.95], [-6.8, 40.35], [-7.0, 40.2], [-6.9, 39.85], [-7.53, 39.67], [-7.3, 39.45],
  [-7.05, 38.9], [-7.3, 38.45], [-7.0, 38.1], [-7.5, 37.55], [-7.42, 37.18], [-7.9, 37.0], [-8.6, 37.12], [-8.99, 37.02],
  [-8.8, 37.6], [-8.8, 38.1], [-8.9, 38.5], [-9.2, 38.45], [-9.48, 38.72], [-9.4, 39.1], [-9.05, 39.7], [-8.85, 40.15],
  [-8.65, 40.75], [-8.7, 41.2],
];

/** Five assets racing over 24 steps (cumulative return %). */
export function raceSeries(): { name: string; color: string; values: number[] }[] {
  const rnd = seeded(77);
  const assets: [string, string, number][] = [
    ['Ouro', '#ffc107', 0.6],
    ['Bitcoin', '#ff9800', 1.9],
    ['S&P 500', '#2962ff', 0.9],
    ['Obrigações', '#089981', 0.3],
    ['Petróleo', '#f23645', 0.7],
  ];
  return assets.map(([name, color, vol]) => {
    let v = 0;
    return { name, color, values: Array.from({ length: 24 }, () => (v += 0.6 + gauss(rnd) * vol * 2.2)) };
  });
}

/** OHLC of a made-up stock over 30 days: [date, open, close, low, high]. */
export function candles(n = 30, seed = 21): [string, number, number, number, number][] {
  const rnd = seeded(seed);
  let p = 100;
  const d0 = new Date(2026, 8, 1);
  const out: [string, number, number, number, number][] = [];
  for (let i = 0, k = 0; k < n; i++) {
    const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    k++;
    const o = p;
    const c = +(o * (1 + gauss(rnd) * 0.02)).toFixed(2);
    const hi = +(Math.max(o, c) * (1 + rnd() * 0.012)).toFixed(2);
    const lo = +(Math.min(o, c) * (1 - rnd() * 0.012)).toFixed(2);
    out.push([`${d.getDate()}/${d.getMonth() + 1}`, +o.toFixed(2), c, lo, hi]);
    p = c;
  }
  return out;
}

/** Color at t (0–1) along a list of hex colors. */
export function colorRamp(colors: string[], t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(x));
  const f = x - i;
  const c = (hex: string): number[] => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
  const a = c(colors[i]);
  const b = c(colors[i + 1]);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(', ')})`;
}
