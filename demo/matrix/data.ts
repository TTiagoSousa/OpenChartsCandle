/** Data and small canvas helpers for the matrix examples (made up for the demo, except the periodic table). */
import type { MatrixHeaderInput, MatrixRect } from 'openchartscandle/matrix';
import { gauss, seeded } from '../scatter/data';

export { seeded };

export const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Trimestre › Mês, for a multi-level x header. */
export const QUARTER_MONTHS: MatrixHeaderInput[] = [0, 1, 2, 3].map((q) => ({ value: `T${q + 1}`, children: MONTHS.slice(q * 3, q * 3 + 3) }));

export const pct = (v: number, d = 1): string => `${v > 0 ? '+' : ''}${v.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d })}%`;

// ---------------------------------------------------------------- assets

export const ASSETS = ['S&P 500', 'Nasdaq', 'Euro Stoxx', 'Ouro', 'Petróleo', 'Bitcoin', 'Obrig. 10A', 'EUR/USD'];

/** Daily returns (%) of the assets from a few common factors, so the correlations look real. */
export function assetReturns(days = 250, seed = 7): number[][] {
  const rnd = seeded(seed);
  // loadings on [equity, risk-off, dollar, crypto] + own volatility
  const L: [number, number, number, number, number][] = [
    [1.0, -0.1, 0, 0.1, 0.35],
    [1.25, -0.15, 0, 0.2, 0.55],
    [0.8, -0.05, -0.3, 0.05, 0.6],
    [-0.05, 0.6, -0.5, 0.05, 0.7],
    [0.45, -0.3, -0.2, 0, 1.6],
    [0.6, -0.2, 0, 2.6, 1.8],
    [-0.25, 0.55, 0.1, 0, 0.35],
    [0.1, 0.05, -0.8, 0, 0.3],
  ];
  const out = L.map(() => [] as number[]);
  for (let t = 0; t < days; t++) {
    const f = [gauss(rnd), gauss(rnd), gauss(rnd), gauss(rnd)];
    L.forEach((l, i) => out[i].push(+(l[0] * f[0] + l[1] * f[1] + l[2] * f[2] + l[3] * f[3] + l[4] * gauss(rnd)).toFixed(3)));
  }
  return out;
}

/** Sample covariance matrix (same units² as the series). */
export function covariance(series: number[][]): number[][] {
  const n = series.length;
  const mean = series.map((s) => s.reduce((a, b) => a + b, 0) / s.length);
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const a = series[i];
      const b = series[j];
      let s = 0;
      for (let t = 0; t < a.length; t++) s += (a[t] - mean[i]) * (b[t] - mean[j]);
      return s / (a.length - 1);
    }),
  );
}

// ---------------------------------------------------------------- monthly returns

export interface MonthCell {
  /** % return of the month */
  ret: number;
  /** Index path through the month (starts at 100) */
  path: number[];
}

/** Monthly returns of a made-up fund, years × 12 months, with the daily path of each month. */
export function monthlyReturns(years: number[], seed = 3): MonthCell[][] {
  const rnd = seeded(seed);
  return years.map(() =>
    MONTHS.map(() => {
      const drift = (rnd() - 0.38) * 0.35;
      const path = [100];
      for (let d = 0; d < 21; d++) path.push(path[d] * (1 + (drift + gauss(rnd) * 0.65) / 100));
      return { ret: +((path[21] / 100 - 1) * 100).toFixed(2), path };
    }),
  );
}

// ---------------------------------------------------------------- watchlist

export interface Quote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  closes: number[];
  volumes: number[];
  candles: [o: number, h: number, l: number, c: number][];
  low52: number;
  high52: number;
}

const TICKERS: [string, string, number][] = [
  ['AAPL', 'Apple', 228],
  ['MSFT', 'Microsoft', 431],
  ['NVDA', 'Nvidia', 138],
  ['AMZN', 'Amazon', 187],
  ['GOOGL', 'Alphabet', 166],
  ['META', 'Meta', 582],
  ['TSLA', 'Tesla', 251],
  ['EDP', 'EDP', 3.9],
  ['GALP', 'Galp', 16.4],
];

/** A watchlist: 40 closes, 20 volumes and 12 daily candles per ticker. */
export function watchlist(seed = 11): Quote[] {
  const rnd = seeded(seed);
  return TICKERS.map(([ticker, name, last]) => {
    const vol = 0.012 + rnd() * 0.02;
    const closes = [last];
    for (let i = 1; i < 40; i++) closes.unshift(closes[0] / (1 + (gauss(rnd) * vol + 0.0008)));
    const volumes = Array.from({ length: 20 }, () => 0.4 + rnd());
    const candles: Quote['candles'] = [];
    let c = closes[closes.length - 13];
    for (let i = 0; i < 12; i++) {
      const o = c;
      c = closes[closes.length - 12 + i];
      const hi = Math.max(o, c) * (1 + rnd() * vol * 0.8);
      const lo = Math.min(o, c) * (1 - rnd() * vol * 0.8);
      candles.push([o, hi, lo, c]);
    }
    const prev = closes[closes.length - 2];
    const low52 = Math.min(...closes) * (0.82 + rnd() * 0.1);
    const high52 = Math.max(...closes) * (1.03 + rnd() * 0.12);
    return { ticker, name, price: last, change: (last / prev - 1) * 100, closes, volumes, candles, low52, high52 };
  });
}

// ---------------------------------------------------------------- tiny canvas drawings

export const UP = '#089981';
export const DOWN = '#f23645';

/** A sparkline in a rect (optionally with the area under it and a dot at the end). */
export function drawSpark(ctx: CanvasRenderingContext2D, r: MatrixRect, values: number[], color: string, opts: { pad?: number; area?: boolean; dot?: boolean; base?: number } = {}): void {
  const pad = opts.pad ?? 4;
  if (values.length < 2 || r.w < 2 * pad + 4 || r.h < 2 * pad + 2) return;
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (opts.base !== undefined) {
    min = Math.min(min, opts.base);
    max = Math.max(max, opts.base);
  }
  const span = max - min || 1;
  const X = (i: number): number => r.x + pad + (i / (values.length - 1)) * (r.w - 2 * pad);
  const Y = (v: number): number => r.y + r.h - pad - ((v - min) / span) * (r.h - 2 * pad);
  if (opts.base !== undefined) {
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(r.x + pad, Math.round(Y(opts.base)) + 0.5);
    ctx.lineTo(r.x + r.w - pad, Math.round(Y(opts.base)) + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.beginPath();
  values.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  ctx.stroke();
  if (opts.area) {
    ctx.lineTo(X(values.length - 1), r.y + r.h - pad);
    ctx.lineTo(X(0), r.y + r.h - pad);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, `${color}55`);
    g.addColorStop(1, `${color}00`);
    ctx.fillStyle = g;
    ctx.fill();
  }
  if (opts.dot) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(X(values.length - 1), Y(values[values.length - 1]), 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Vertical mini bars (value ≥ 0), the last one highlighted. */
export function drawBars(ctx: CanvasRenderingContext2D, r: MatrixRect, values: number[], color: string, opts: { pad?: number; highlight?: string; max?: number } = {}): void {
  const pad = opts.pad ?? 4;
  const n = values.length;
  if (!n || r.w < 2 * pad + n || r.h < 2 * pad + 2) return;
  const max = opts.max ?? (Math.max(...values) || 1);
  const step = (r.w - 2 * pad) / n;
  const bw = Math.max(1, step * 0.7);
  values.forEach((v, i) => {
    const h = (Math.max(0, v) / max) * (r.h - 2 * pad);
    ctx.fillStyle = i === n - 1 && opts.highlight ? opts.highlight : color;
    ctx.fillRect(r.x + pad + i * step + (step - bw) / 2, r.y + r.h - pad - h, bw, h);
  });
}

/** Mini candlesticks. */
export function drawCandles(ctx: CanvasRenderingContext2D, r: MatrixRect, candles: [number, number, number, number][], pad = 4): void {
  const n = candles.length;
  if (!n || r.w < 2 * pad + n * 2 || r.h < 2 * pad + 4) return;
  const lo = Math.min(...candles.map((c) => c[2]));
  const hi = Math.max(...candles.map((c) => c[1]));
  const span = hi - lo || 1;
  const Y = (v: number): number => r.y + r.h - pad - ((v - lo) / span) * (r.h - 2 * pad);
  const step = (r.w - 2 * pad) / n;
  const bw = Math.max(1, Math.min(8, step * 0.62));
  candles.forEach(([o, h, l, c], i) => {
    const x = r.x + pad + i * step + step / 2;
    const col = c >= o ? UP : DOWN;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, Y(h));
    ctx.lineTo(Math.round(x) + 0.5, Y(l));
    ctx.stroke();
    const y0 = Y(Math.max(o, c));
    ctx.fillRect(Math.round(x - bw / 2), y0, Math.round(bw), Math.max(1, Y(Math.min(o, c)) - y0));
  });
}

// ---------------------------------------------------------------- Portugal (tile map)

/** NUTS II regions of mainland Portugal and the islands (a made-up index per quarter). */
export const PT_REGIONS: { name: string; sales: number[]; share: number }[] = [
  { name: 'Norte', sales: [62, 71, 68, 80], share: 31 },
  { name: 'Centro', sales: [41, 44, 47, 45], share: 19 },
  { name: 'Lisboa', sales: [88, 92, 97, 104], share: 33 },
  { name: 'Alentejo', sales: [14, 16, 15, 18], share: 6 },
  { name: 'Algarve', sales: [12, 19, 27, 15], share: 6 },
  { name: 'Açores', sales: [5, 6, 7, 6], share: 2.5 },
  { name: 'Madeira', sales: [6, 6, 8, 7], share: 2.5 },
];

/** Districts as tiles on a 4 × 7 grid (col, row), with their region. Not to scale: a cartogram, not a map. */
export const PT_TILES: { id: string; col: number; row: number; region: string }[] = [
  { id: 'VC', col: 1, row: 0, region: 'Norte' },
  { id: 'BR', col: 2, row: 0, region: 'Norte' },
  { id: 'VR', col: 3, row: 0, region: 'Norte' },
  { id: 'BG', col: 4, row: 0, region: 'Norte' },
  { id: 'PO', col: 1, row: 1, region: 'Norte' },
  { id: 'VI', col: 2, row: 1, region: 'Centro' },
  { id: 'GU', col: 3, row: 1, region: 'Centro' },
  { id: 'AV', col: 1, row: 2, region: 'Centro' },
  { id: 'CO', col: 2, row: 2, region: 'Centro' },
  { id: 'CB', col: 3, row: 2, region: 'Centro' },
  { id: 'LE', col: 1, row: 3, region: 'Centro' },
  { id: 'SA', col: 2, row: 3, region: 'Alentejo' },
  { id: 'PT', col: 3, row: 3, region: 'Alentejo' },
  { id: 'LX', col: 1, row: 4, region: 'Lisboa' },
  { id: 'SE', col: 2, row: 4, region: 'Lisboa' },
  { id: 'EV', col: 3, row: 4, region: 'Alentejo' },
  { id: 'BE', col: 2, row: 5, region: 'Alentejo' },
  { id: 'FA', col: 2, row: 6, region: 'Algarve' },
  { id: 'AC', col: 0, row: 5, region: 'Açores' },
  { id: 'MA', col: 0, row: 6, region: 'Madeira' },
];

/** Draws the tile map with `region` lit. */
export function drawTiles(ctx: CanvasRenderingContext2D, r: MatrixRect, region: string, lit: string, dim: string): void {
  const cols = 5;
  const rows = 7;
  const s = Math.min((r.w - 6) / cols, (r.h - 6) / rows);
  if (s < 3) return;
  const ox = r.x + (r.w - s * cols) / 2;
  const oy = r.y + (r.h - s * rows) / 2;
  for (const t of PT_TILES) {
    ctx.fillStyle = t.region === region ? lit : dim;
    ctx.beginPath();
    ctx.roundRect(ox + t.col * s + 0.6, oy + t.row * s + 0.6, s - 1.2, s - 1.2, Math.min(2.5, s / 4));
    ctx.fill();
  }
}

// ---------------------------------------------------------------- periodic table

const SYMBOLS =
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(
    ' ',
  );
const NAMES =
  'Hidrogénio,Hélio,Lítio,Berílio,Boro,Carbono,Azoto,Oxigénio,Flúor,Néon,Sódio,Magnésio,Alumínio,Silício,Fósforo,Enxofre,Cloro,Árgon,Potássio,Cálcio,Escândio,Titânio,Vanádio,Crómio,Manganês,Ferro,Cobalto,Níquel,Cobre,Zinco,Gálio,Germânio,Arsénio,Selénio,Bromo,Crípton,Rubídio,Estrôncio,Ítrio,Zircónio,Nióbio,Molibdénio,Tecnécio,Ruténio,Ródio,Paládio,Prata,Cádmio,Índio,Estanho,Antimónio,Telúrio,Iodo,Xénon,Césio,Bário,Lantânio,Cério,Praseodímio,Neodímio,Promécio,Samário,Európio,Gadolínio,Térbio,Disprósio,Hólmio,Érbio,Túlio,Itérbio,Lutécio,Háfnio,Tântalo,Tungsténio,Rénio,Ósmio,Irídio,Platina,Ouro,Mercúrio,Tálio,Chumbo,Bismuto,Polónio,Astato,Rádon,Frâncio,Rádio,Actínio,Tório,Protactínio,Urânio,Neptúnio,Plutónio,Amerício,Cúrio,Berquélio,Califórnio,Einsténio,Férmio,Mendelévio,Nobélio,Laurêncio,Rutherfórdio,Dúbnio,Seabórgio,Bóhrio,Hássio,Meitnério,Darmstácio,Roentgénio,Copernício,Nipónio,Fleróvio,Moscóvio,Livermório,Tenesso,Oganésson'.split(
    ',',
  );

export const ELEMENT_CATEGORIES: { name: string; color: string }[] = [
  { name: 'Metais alcalinos', color: '#ef5350' },
  { name: 'Metais alcalinoterrosos', color: '#ff9800' },
  { name: 'Metais de transição', color: '#d4b43c' },
  { name: 'Outros metais', color: '#26a69a' },
  { name: 'Semimetais', color: '#42a5f5' },
  { name: 'Não metais', color: '#7e57c2' },
  { name: 'Gases nobres', color: '#ec407a' },
  { name: 'Lantanídeos', color: '#8d6e63' },
  { name: 'Actinídeos', color: '#78909c' },
];

const inSet = (z: number, list: number[]): boolean => list.includes(z);

function categoryOf(z: number): string {
  if (z >= 57 && z <= 71) return 'Lantanídeos';
  if (z >= 89 && z <= 103) return 'Actinídeos';
  if (inSet(z, [3, 11, 19, 37, 55, 87])) return 'Metais alcalinos';
  if (inSet(z, [4, 12, 20, 38, 56, 88])) return 'Metais alcalinoterrosos';
  if (inSet(z, [2, 10, 18, 36, 54, 86, 118])) return 'Gases nobres';
  if (inSet(z, [1, 6, 7, 8, 9, 15, 16, 17, 34, 35, 53])) return 'Não metais';
  if (inSet(z, [5, 14, 32, 33, 51, 52, 85, 117])) return 'Semimetais';
  if (inSet(z, [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116])) return 'Outros metais';
  return 'Metais de transição';
}

export interface Element {
  z: number;
  symbol: string;
  name: string;
  category: string;
  /** Group 1–18 (column, 0-based) and row (0-based; lanthanides / actinides on rows 8 and 9) */
  col: number;
  row: number;
  period: number;
}

/** The 118 elements with their place in the table. */
export function elements(): Element[] {
  const out: Element[] = [];
  const starts = [1, 3, 11, 19, 37, 55, 87, 119];
  for (let z = 1; z <= 118; z++) {
    const p = starts.findIndex((s, i) => z >= s && z < starts[i + 1]);
    const k = z - starts[p];
    let col: number;
    let row = p;
    if (p === 0) col = z === 1 ? 0 : 17;
    else if (p <= 2) col = k < 2 ? k : k + 10;
    else if (p <= 4) col = k;
    else if (k < 2) col = k;
    else if (k <= 16) {
      // f-block: its own row below the table
      row = p + 3;
      col = k + 1;
    } else col = k - 14;
    out.push({ z, symbol: SYMBOLS[z - 1], name: NAMES[z - 1], category: categoryOf(z), col, row, period: p + 1 });
  }
  return out;
}

// ---------------------------------------------------------------- MBTI

export const MBTI = ['INFP', 'ENFP', 'INFJ', 'ENFJ', 'INTJ', 'ENTJ', 'INTP', 'ENTP', 'ISFP', 'ESFP', 'ISTP', 'ESTP', 'ISFJ', 'ESFJ', 'ISTJ', 'ESTJ'];

export const MBTI_LEVELS = [
  { value: 5, label: 'Ideal', color: '#2bb673' },
  { value: 4, label: 'Boa', color: '#8bc34a' },
  { value: 3, label: 'Pode resultar', color: '#ffd54f' },
  { value: 2, label: 'Pouco provável', color: '#ff9800' },
  { value: 1, label: 'Difícil', color: '#ef5350' },
];

/** An illustrative compatibility score 1–5 (a popular chart's rule of thumb, not science). */
export function mbtiScore(a: string, b: string): number {
  const n = (t: string): boolean => t[1] === 'N';
  const comp = a[0] !== b[0] && a[3] !== b[3];
  if (n(a) && n(b)) return comp ? 5 : 4;
  if (!n(a) && !n(b)) return comp ? 4 : 3;
  const nf = (t: string): boolean => t[1] === 'N' && t[2] === 'F';
  return nf(a) || nf(b) ? 1 : 2;
}
