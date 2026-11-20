import { N, S, stdevAt } from './base';
import {
  BLUE,
  GREY,
  ORANGE,
  STUDY_DEFS,
  type LevelDef,
  type Src,
  type StudyContext,
  type StudyDef,
  at,
  averageStudy,
  each,
  highest,
  len,
  lowest,
  ma,
  num,
  nz,
  oscFill,
  oscLevels,
  src,
  sum,
  trueRange,
  zeroLevel,
} from './studies';

/*
 * More TradingView indicators on the same engine as `studies.ts`: averages (DEMA, TEMA, SMMA, ALMA, LSMA,
 * McGinley), channels (Envelopes, Alligator), oscillators and volume indicators. Public formulas, written here.
 */

/** Change from the bar before (NaN on the first bar), like Pine's `ta.change`. */
const change = (s: Src, i: number, n = 1): number => (i - n < 0 ? NaN : s(i) - s(i - n));

/** Pine's `ta.swma`: weights 1, 2, 2, 1 over the last four values. */
const swma = (s: Src, i: number): number => (i < 3 ? NaN : (s(i - 3) + 2 * s(i - 2) + 2 * s(i - 1) + s(i)) / 6);

/** A running total from the first bar (Pine's `ta.cum`), NaN counted as 0. */
function cumInto(c: StudyContext, out: number[], f: (i: number) => number): void {
  for (let i = c.from; i < c.n; i++) out[i] = (i > 0 ? nz(out[i - 1]) : 0) + nz(f(i));
}

/** Accumulation / distribution of one bar (the volume weighted by where the close is in the range). */
function adOf(c: StudyContext, i: number): number {
  const x = c.bars[i];
  return (x.close === x.high && x.close === x.low) || x.high === x.low ? 0 : ((2 * x.close - x.low - x.high) / (x.high - x.low)) * x.volume;
}

const DMI = STUDY_DEFS.find((d) => d.type === 'dmi')!;

/** EMA of an EMA (… of an EMA): `depth` series kept in the working arrays `e1`, `e2`, `e3`. */
function emas(c: StudyContext, s: Src, n: number, depth: number): number[][] {
  const out: number[][] = [];
  let input = s;
  for (let k = 1; k <= depth; k++) {
    const e = c.tmp(`e${k}`);
    ma(c, e, input, n, 'ema');
    out.push(e);
    input = at(e);
  }
  return out;
}

const fisherLevels: LevelDef[] = [
  { key: 'l1', label: 'Nível 1,5', value: 1.5, color: '#e91e63' },
  { key: 'l2', label: 'Nível 0,75', value: 0.75, color: GREY },
  { key: 'l3', label: 'Nível 0', value: 0, color: '#e91e63' },
  { key: 'l4', label: 'Nível −0,75', value: -0.75, color: GREY },
  { key: 'l5', label: 'Nível −1,5', value: -1.5, color: '#e91e63' },
];

export const EXTRA_STUDY_DEFS: StudyDef[] = [
  // ---------------- averages ----------------
  averageStudy(
    'dema',
    'Double EMA',
    'DEMA',
    'Média exponencial dupla (DEMA)',
    9,
    (c, n) => {
      const [e1, e2] = emas(c, c.src(S(c.p, 'source')), n, 2);
      each(c, c.out('ma'), (i) => 2 * e1[i] - e2[i]);
    },
    (n) => 20 * n,
  ),
  averageStudy(
    'tema',
    'Triple EMA',
    'TEMA',
    'Média exponencial tripla (TEMA)',
    9,
    (c, n) => {
      const [e1, e2, e3] = emas(c, c.src(S(c.p, 'source')), n, 3);
      each(c, c.out('ma'), (i) => 3 * (e1[i] - e2[i]) + e3[i]);
    },
    (n) => 30 * n,
  ),
  averageStudy('smma', 'Smoothed Moving Average', 'SMMA', 'Média móvel suavizada (SMMA / RMA)', 7, (c, n) => ma(c, c.out('ma'), c.src(S(c.p, 'source')), n, 'rma'), (n) => 10 * n),
  averageStudy(
    'mgd',
    'McGinley Dynamic',
    'McGinley',
    'McGinley Dynamic: uma média que acelera com o preço',
    14,
    (c, n) => {
      const s = c.src(S(c.p, 'source'));
      const out = c.out('ma');
      for (let i = c.from; i < c.n; i++) {
        const prev = i > 0 ? out[i - 1] : NaN;
        out[i] = isFinite(prev) && prev !== 0 ? prev + (s(i) - prev) / (n * Math.pow(s(i) / prev, 4)) : s(i);
      }
    },
    (n) => 10 * n,
  ),
  {
    type: 'alma',
    name: 'Arnaud Legoux Moving Average',
    short: 'ALMA',
    description: 'Média móvel de Arnaud Legoux (ALMA), com pesos gaussianos',
    overlay: true,
    inputs: [num('length', 'Período', 1, 1000), num('almaOffset', 'Offset', 0, 1, 0.01), num('sigma', 'Sigma', 0.01, 100, 0.1), src()],
    defaults: { length: 9, almaOffset: 0.85, sigma: 6, source: 'close' },
    plots: [{ key: 'ma', label: 'ALMA', color: BLUE }],
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const m = N(c.p, 'almaOffset') * (n - 1);
      const sd = n / N(c.p, 'sigma');
      const w = Array.from({ length: n }, (_, k) => Math.exp(-((k - m) ** 2) / (2 * sd * sd)));
      const norm = w.reduce((a, b) => a + b, 0);
      const s = c.src(S(c.p, 'source'));
      each(c, c.out('ma'), (i) => {
        if (i - n + 1 < 0) return NaN;
        let t = 0;
        for (let k = 0; k < n; k++) t += s(i - (n - 1 - k)) * w[k];
        return t / norm;
      });
    },
  },
  {
    type: 'lsma',
    name: 'Least Squares Moving Average',
    short: 'LSMA',
    description: 'Média dos mínimos quadrados (regressão linear)',
    overlay: true,
    inputs: [num('length', 'Período', 2, 1000), num('lrOffset', 'Offset', 0, 500), src()],
    defaults: { length: 25, lrOffset: 0, source: 'close' },
    plots: [{ key: 'ma', label: 'LSMA', color: BLUE }],
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const off = Math.round(N(c.p, 'lrOffset')) || 0;
      const s = c.src(S(c.p, 'source'));
      const sx = (n * (n - 1)) / 2;
      const sxx = ((n - 1) * n * (2 * n - 1)) / 6;
      each(c, c.out('ma'), (i) => {
        if (i - n + 1 < 0) return NaN;
        let sy = 0;
        let sxy = 0;
        for (let x = 0; x < n; x++) {
          const y = s(i - n + 1 + x);
          sy += y;
          sxy += x * y;
        }
        const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
        const intercept = (sy - slope * sx) / n;
        return intercept + slope * (n - 1 - off);
      });
    },
  },
  {
    type: 'env',
    name: 'Envelopes',
    short: 'Env',
    description: 'Envelopes: uma média com bandas a uma percentagem fixa',
    overlay: true,
    inputs: [num('length', 'Período', 1, 1000), num('percent', 'Percentagem', 0, 100, 0.1), src(), { key: 'exponential', label: 'Exponencial', type: 'bool' }],
    defaults: { length: 20, percent: 10, source: 'close', exponential: false },
    plots: [
      { key: 'basis', label: 'Base', color: ORANGE },
      { key: 'upper', label: 'Superior', color: BLUE },
      { key: 'lower', label: 'Inferior', color: BLUE },
    ],
    fills: [{ key: 'bg', label: 'Fundo', a: 'upper', b: 'lower', color: 'rgba(33,150,243,0.1)' }],
    warmup: (p) => (p.exponential ? 10 : 1) * len(p, 'length'),
    compute: (c) => {
      const basis = c.out('basis');
      ma(c, basis, c.src(S(c.p, 'source')), len(c.p, 'length'), c.p.exponential ? 'ema' : 'sma');
      const k = N(c.p, 'percent') / 100;
      each(c, c.out('upper'), (i) => basis[i] * (1 + k));
      each(c, c.out('lower'), (i) => basis[i] * (1 - k));
    },
    title: (p) => `Env ${len(p, 'length')} ${N(p, 'percent')} ${p.source} ${p.exponential ? 'EMA' : 'SMA'}`,
  },
  {
    type: 'alligator',
    name: 'Williams Alligator',
    short: 'Alligator',
    description: 'Alligator de Williams: maxila, dentes e lábios, médias suavizadas deslocadas',
    overlay: true,
    inputs: [
      num('jawLength', 'Período da maxila', 1, 1000),
      num('teethLength', 'Período dos dentes', 1, 1000),
      num('lipsLength', 'Período dos lábios', 1, 1000),
      num('jawOffset', 'Deslocamento da maxila', -500, 500),
      num('teethOffset', 'Deslocamento dos dentes', -500, 500),
      num('lipsOffset', 'Deslocamento dos lábios', -500, 500),
    ],
    defaults: { jawLength: 13, teethLength: 8, lipsLength: 5, jawOffset: 8, teethOffset: 5, lipsOffset: 3 },
    plots: [
      { key: 'jaw', label: 'Maxila', color: BLUE, offset: (p) => N(p, 'jawOffset') },
      { key: 'teeth', label: 'Dentes', color: '#e91e63', offset: (p) => N(p, 'teethOffset') },
      { key: 'lips', label: 'Lábios', color: '#66bb6a', offset: (p) => N(p, 'lipsOffset') },
    ],
    warmup: (p) => 10 * len(p, 'jawLength'),
    compute: (c) => {
      const s = c.src('hl2');
      ma(c, c.out('jaw'), s, len(c.p, 'jawLength'), 'rma');
      ma(c, c.out('teeth'), s, len(c.p, 'teethLength'), 'rma');
      ma(c, c.out('lips'), s, len(c.p, 'lipsLength'), 'rma');
    },
    title: (p) => `Alligator ${len(p, 'jawLength')} ${len(p, 'teethLength')} ${len(p, 'lipsLength')}`,
  },

  // ---------------- oscillators ----------------
  {
    type: 'adx',
    name: 'Average Directional Index',
    short: 'ADX',
    description: 'Índice direcional médio (ADX): a força da tendência',
    overlay: false,
    inputs: [num('adxSmoothing', 'Suavização do ADX', 1, 1000), num('diLength', 'Período DI', 1, 1000)],
    defaults: { adxSmoothing: 14, diLength: 14 },
    plots: [{ key: 'adx', label: 'ADX', color: '#f50057' }],
    format: 2,
    warmup: DMI.warmup,
    // the DMI's computation, with +DI and −DI kept as working series
    compute: (c) => DMI.compute({ ...c, out: (k) => (k === 'adx' ? c.out('adx') : c.tmp(`_${k}`)) }),
  },
  {
    type: 'uo',
    name: 'Ultimate Oscillator',
    short: 'UO',
    description: 'Oscilador definitivo (UO): a pressão compradora em três períodos',
    overlay: false,
    inputs: [num('fast', 'Rápido', 1, 1000), num('middle', 'Médio', 1, 1000), num('slow', 'Lento', 1, 1000)],
    defaults: { fast: 7, middle: 14, slow: 28 },
    plots: [{ key: 'uo', label: 'UO', color: '#f44336' }],
    format: 2,
    warmup: (p) => Math.max(len(p, 'fast'), len(p, 'middle'), len(p, 'slow')) + 1,
    compute: (c) => {
      const b = c.bars;
      const bp = c.tmp('bp');
      const tr = c.tmp('tr');
      each(c, bp, (i) => (i === 0 ? NaN : b[i].close - Math.min(b[i].low, b[i - 1].close)));
      each(c, tr, (i) => (i === 0 ? NaN : Math.max(b[i].high, b[i - 1].close) - Math.min(b[i].low, b[i - 1].close)));
      const avg = (i: number, n: number): number => sum(at(bp), i, n) / sum(at(tr), i, n);
      each(c, c.out('uo'), (i) => (100 * (4 * avg(i, len(c.p, 'fast')) + 2 * avg(i, len(c.p, 'middle')) + avg(i, len(c.p, 'slow')))) / 7);
    },
  },
  {
    type: 'trix',
    name: 'TRIX',
    short: 'TRIX',
    description: 'TRIX: variação de uma EMA tripla do logaritmo do preço',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000)],
    defaults: { length: 18 },
    plots: [{ key: 'trix', label: 'TRIX', color: '#b71c1c' }],
    levels: zeroLevel(),
    format: 4,
    warmup: (p) => 30 * len(p, 'length'),
    compute: (c) => {
      const [, , e3] = emas(c, (i) => Math.log(c.bars[i].close), len(c.p, 'length'), 3);
      each(c, c.out('trix'), (i) => 10000 * change(at(e3), i));
    },
  },
  {
    type: 'tsi',
    name: 'True Strength Index',
    short: 'TSI',
    description: 'Índice de força verdadeira (TSI), com linha de sinal',
    overlay: false,
    inputs: [num('long', 'Período longo', 1, 1000), num('short', 'Período curto', 1, 1000), num('signal', 'Período do sinal', 1, 1000)],
    defaults: { long: 25, short: 13, signal: 13 },
    plots: [
      { key: 'tsi', label: 'TSI', color: BLUE },
      { key: 'sig', label: 'Sinal', color: '#e91e63' },
    ],
    levels: zeroLevel(),
    format: 4,
    warmup: (p) => 10 * (len(p, 'long') + len(p, 'short') + len(p, 'signal')),
    compute: (c) => {
      const close = (i: number): number => c.bars[i].close;
      const pc = c.tmp('pc');
      const apc = c.tmp('apc');
      each(c, pc, (i) => change(close, i));
      each(c, apc, (i) => Math.abs(pc[i]));
      const l1 = c.tmp('l1');
      const l2 = c.tmp('l2');
      const a1 = c.tmp('a1');
      const a2 = c.tmp('a2');
      ma(c, l1, at(pc), len(c.p, 'long'), 'ema');
      ma(c, l2, at(l1), len(c.p, 'short'), 'ema');
      ma(c, a1, at(apc), len(c.p, 'long'), 'ema');
      ma(c, a2, at(a1), len(c.p, 'short'), 'ema');
      const tsi = c.out('tsi');
      each(c, tsi, (i) => (a2[i] === 0 ? NaN : (100 * l2[i]) / a2[i]));
      ma(c, c.out('sig'), at(tsi), len(c.p, 'signal'), 'ema');
    },
  },
  {
    type: 'cmo',
    name: 'Chande Momentum Oscillator',
    short: 'ChandeMO',
    description: 'Oscilador de momento de Chande (CMO)',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), src()],
    defaults: { length: 9, source: 'close' },
    plots: [{ key: 'cmo', label: 'ChandeMO', color: BLUE }],
    levels: zeroLevel(),
    format: 2,
    warmup: (p) => len(p, 'length') + 1,
    compute: (c) => {
      const n = len(c.p, 'length');
      const s = c.src(S(c.p, 'source'));
      each(c, c.out('cmo'), (i) => {
        if (i - n < 0) return NaN;
        let up = 0;
        let dn = 0;
        for (let k = i - n + 1; k <= i; k++) {
          const m = s(k) - s(k - 1);
          if (m >= 0) up += m;
          else dn -= m;
        }
        return up + dn === 0 ? 0 : (100 * (up - dn)) / (up + dn);
      });
    },
  },
  {
    type: 'dpo',
    name: 'Detrended Price Oscillator',
    short: 'DPO',
    description: 'Oscilador de preço sem tendência (DPO)',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), { key: 'centered', label: 'Centrado', type: 'bool' }],
    defaults: { length: 21, centered: false },
    plots: [{ key: 'dpo', label: 'DPO', color: '#43a047', offset: (p) => (p.centered ? -(Math.floor(len(p, 'length') / 2) + 1) : 0) }],
    levels: zeroLevel(),
    warmup: (p) => len(p, 'length') * 2,
    compute: (c) => {
      const n = len(c.p, 'length');
      const back = Math.floor(n / 2) + 1;
      const sma = c.tmp('sma');
      const close = (i: number): number => c.bars[i].close;
      ma(c, sma, close, n, 'sma');
      each(c, c.out('dpo'), (i) => (i - back < 0 ? NaN : c.p.centered ? close(i - back) - sma[i] : close(i) - sma[i - back]));
    },
    title: (p) => `DPO ${len(p, 'length')}${p.centered ? ' centrado' : ''}`,
  },
  {
    type: 'coppock',
    name: 'Coppock Curve',
    short: 'Coppock',
    description: 'Curva de Coppock: WMA da soma de duas taxas de variação',
    overlay: false,
    inputs: [num('wmaLength', 'Período da WMA', 1, 1000), num('longRoc', 'ROC longo', 1, 1000), num('shortRoc', 'ROC curto', 1, 1000)],
    defaults: { wmaLength: 10, longRoc: 14, shortRoc: 11 },
    plots: [{ key: 'cc', label: 'Coppock', color: BLUE }],
    levels: zeroLevel(),
    format: 2,
    warmup: (p) => Math.max(len(p, 'longRoc'), len(p, 'shortRoc')) + len(p, 'wmaLength'),
    compute: (c) => {
      const close = (i: number): number => c.bars[i].close;
      const roc = (i: number, n: number): number => (i - n < 0 ? NaN : (100 * (close(i) - close(i - n))) / close(i - n));
      const raw = c.tmp('raw');
      each(c, raw, (i) => roc(i, len(c.p, 'longRoc')) + roc(i, len(c.p, 'shortRoc')));
      ma(c, c.out('cc'), at(raw), len(c.p, 'wmaLength'), 'wma');
    },
  },
  {
    type: 'fisher',
    name: 'Fisher Transform',
    short: 'Fisher',
    description: 'Transformada de Fisher: os pontos de viragem mais nítidos',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000)],
    defaults: { length: 9 },
    plots: [
      { key: 'fisher', label: 'Fisher', color: BLUE },
      { key: 'trigger', label: 'Gatilho', color: ORANGE },
    ],
    levels: fisherLevels,
    format: 2,
    warmup: (p) => len(p, 'length') + 50,
    compute: (c) => {
      const n = len(c.p, 'length');
      const hl2 = c.src('hl2');
      const value = c.tmp('value');
      const fisher = c.out('fisher');
      const round = (v: number): number => (v > 0.99 ? 0.999 : v < -0.99 ? -0.999 : v);
      for (let i = c.from; i < c.n; i++) {
        const hi = highest(hl2, i, n);
        const lo = lowest(hl2, i, n);
        const pv = i > 0 ? nz(value[i - 1]) : 0;
        value[i] = round(0.66 * ((hl2(i) - lo) / (hi - lo) - 0.5) + 0.67 * pv);
        const pf = i > 0 ? nz(fisher[i - 1]) : 0;
        fisher[i] = 0.5 * Math.log((1 + value[i]) / (1 - value[i])) + 0.5 * pf;
      }
      each(c, c.out('trigger'), (i) => (i > 0 ? fisher[i - 1] : NaN));
    },
  },
  {
    type: 'rvi',
    name: 'Relative Vigor Index',
    short: 'RVGI',
    description: 'Índice de vigor relativo (RVI), com linha de sinal',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000)],
    defaults: { length: 10 },
    plots: [
      { key: 'rvi', label: 'RVGI', color: '#008000' },
      { key: 'sig', label: 'Sinal', color: '#ff0000' },
    ],
    format: 4,
    warmup: (p) => len(p, 'length') + 6,
    compute: (c) => {
      const b = c.bars;
      const num_ = c.tmp('num');
      const den = c.tmp('den');
      each(c, num_, (i) => swma((k) => b[k].close - b[k].open, i));
      each(c, den, (i) => swma((k) => b[k].high - b[k].low, i));
      const n = len(c.p, 'length');
      const rvi = c.out('rvi');
      each(c, rvi, (i) => sum(at(num_), i, n) / sum(at(den), i, n));
      each(c, c.out('sig'), (i) => swma(at(rvi), i));
    },
  },
  {
    type: 'chop',
    name: 'Choppiness Index',
    short: 'CHOP',
    description: 'Índice de agitação: se o mercado está em tendência ou de lado',
    overlay: false,
    inputs: [num('length', 'Período', 2, 1000)],
    defaults: { length: 14 },
    plots: [{ key: 'chop', label: 'CHOP', color: BLUE }],
    levels: oscLevels(61.8, 50, 38.2),
    fills: oscFill(),
    format: 2,
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const b = c.bars;
      each(c, c.out('chop'), (i) => {
        const range = highest((k) => b[k].high, i, n) - lowest((k) => b[k].low, i, n);
        return range > 0 ? (100 * Math.log10(sum((k) => trueRange(b, k), i, n) / range)) / Math.log10(n) : NaN;
      });
    },
  },
  {
    type: 'vortex',
    name: 'Vortex Indicator',
    short: 'VI',
    description: 'Indicador Vortex: VI+ e VI−',
    overlay: false,
    inputs: [num('length', 'Período', 2, 1000)],
    defaults: { length: 14 },
    plots: [
      { key: 'plus', label: 'VI +', color: BLUE },
      { key: 'minus', label: 'VI −', color: '#e91e63' },
    ],
    format: 4,
    warmup: (p) => len(p, 'length') + 1,
    compute: (c) => {
      const n = len(c.p, 'length');
      const b = c.bars;
      const vmp = (k: number): number => (k === 0 ? NaN : Math.abs(b[k].high - b[k - 1].low));
      const vmm = (k: number): number => (k === 0 ? NaN : Math.abs(b[k].low - b[k - 1].high));
      const str = (i: number): number => sum((k) => trueRange(b, k), i, n);
      each(c, c.out('plus'), (i) => sum(vmp, i, n) / str(i));
      each(c, c.out('minus'), (i) => sum(vmm, i, n) / str(i));
    },
  },
  {
    type: 'bop',
    name: 'Balance of Power',
    short: 'BOP',
    description: 'Equilíbrio de poder (BOP): onde fechou a vela entre a máxima e a mínima',
    overlay: false,
    inputs: [],
    defaults: {},
    plots: [{ key: 'bop', label: 'BOP', color: '#ff5252' }],
    levels: [{ ...zeroLevel()[0], hidden: true }],
    format: 3,
    warmup: () => 0,
    compute: (c) => each(c, c.out('bop'), (i) => {
      const x = c.bars[i];
      return x.high === x.low ? NaN : (x.close - x.open) / (x.high - x.low);
    }),
  },
  {
    type: 'bbr',
    name: 'Bollinger Bands %B',
    short: 'BB %B',
    description: 'Bollinger %B: onde está o preço dentro das bandas',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), src(), num('mult', 'Desvio padrão', 0.001, 50, 0.1)],
    defaults: { length: 20, source: 'close', mult: 2 },
    plots: [{ key: 'bbr', label: '%B', color: '#22ab94' }],
    levels: oscLevels(1, 0.5, 0),
    fills: oscFill('rgba(38,166,154,0.1)'),
    format: 4,
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const s = c.src(S(c.p, 'source'));
      const basis = c.tmp('basis');
      ma(c, basis, s, n, 'sma');
      const m = N(c.p, 'mult');
      each(c, c.out('bbr'), (i) => {
        const dev = m * stdevAt(s, i, n);
        return dev === 0 ? NaN : (s(i) - (basis[i] - dev)) / (2 * dev);
      });
    },
  },
  {
    type: 'bbw',
    name: 'Bollinger BandWidth',
    short: 'BBW',
    description: 'Largura das bandas de Bollinger (em % da média)',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), src(), num('mult', 'Desvio padrão', 0.001, 50, 0.1)],
    defaults: { length: 20, source: 'close', mult: 2 },
    plots: [{ key: 'bbw', label: 'BBW', color: BLUE }],
    format: 4,
    warmup: (p) => len(p, 'length'),
    compute: (c) => {
      const n = len(c.p, 'length');
      const s = c.src(S(c.p, 'source'));
      const basis = c.tmp('basis');
      ma(c, basis, s, n, 'sma');
      each(c, c.out('bbw'), (i) => (basis[i] ? (100 * 2 * N(c.p, 'mult') * stdevAt(s, i, n)) / basis[i] : NaN));
    },
  },
  {
    type: 'hv',
    name: 'Historical Volatility',
    short: 'HV',
    description: 'Volatilidade histórica, anualizada, em %',
    overlay: false,
    inputs: [num('length', 'Período', 2, 1000)],
    defaults: { length: 10 },
    plots: [{ key: 'hv', label: 'HV', color: BLUE }],
    format: 2,
    warmup: (p) => len(p, 'length') + 1,
    compute: (c) => {
      const n = len(c.p, 'length');
      const b = c.bars;
      // 365 periods a year; weekly and monthly bars count by weeks (as TradingView)
      const per = c.tf >= 7 * 86400 ? 7 : 1;
      const lr = (i: number): number => (i === 0 ? NaN : Math.log(b[i].close / b[i - 1].close));
      each(c, c.out('hv'), (i) => 100 * stdevAt(lr, i, n) * Math.sqrt(365 / per));
    },
  },

  // ---------------- volume ----------------
  {
    type: 'ad',
    name: 'Accumulation/Distribution',
    short: 'Accum/Dist',
    description: 'Acumulação / distribuição: volume acumulado pelo sítio do fecho na vela',
    overlay: false,
    inputs: [],
    defaults: {},
    plots: [{ key: 'ad', label: 'Accum/Dist', color: '#999915' }],
    format: 'volume',
    warmup: () => 0,
    compute: (c) => cumInto(c, c.out('ad'), (i) => adOf(c, i)),
  },
  {
    type: 'chaikinosc',
    name: 'Chaikin Oscillator',
    short: 'Chaikin Osc',
    description: 'Oscilador de Chaikin: diferença de duas EMAs da acumulação / distribuição',
    overlay: false,
    inputs: [num('fast', 'Período rápido', 1, 1000), num('slow', 'Período lento', 1, 1000)],
    defaults: { fast: 3, slow: 10 },
    plots: [{ key: 'osc', label: 'Chaikin Osc', color: '#ec407a' }],
    levels: zeroLevel(),
    format: 'volume',
    warmup: (p) => 10 * len(p, 'slow'),
    compute: (c) => {
      const ad = c.tmp('ad');
      cumInto(c, ad, (i) => adOf(c, i));
      const f = c.tmp('f');
      const s = c.tmp('s');
      ma(c, f, at(ad), len(c.p, 'fast'), 'ema');
      ma(c, s, at(ad), len(c.p, 'slow'), 'ema');
      each(c, c.out('osc'), (i) => f[i] - s[i]);
    },
  },
  {
    type: 'efi',
    name: 'Elder Force Index',
    short: 'EFI',
    description: 'Índice de força de Elder: variação do preço vezes o volume, suavizada',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000)],
    defaults: { length: 13 },
    plots: [{ key: 'efi', label: 'EFI', color: '#f44336' }],
    levels: zeroLevel(),
    format: 'volume',
    warmup: (p) => 10 * len(p, 'length'),
    compute: (c) => {
      const raw = c.tmp('raw');
      each(c, raw, (i) => change((k) => c.bars[k].close, i) * c.bars[i].volume);
      ma(c, c.out('efi'), at(raw), len(c.p, 'length'), 'ema');
    },
  },
  {
    type: 'eom',
    name: 'Ease of Movement',
    short: 'EOM',
    description: 'Facilidade de movimento: quanto o preço anda por unidade de volume',
    overlay: false,
    inputs: [num('length', 'Período', 1, 1000), num('divisor', 'Divisor', 1, 1e9)],
    defaults: { length: 14, divisor: 10000 },
    plots: [{ key: 'eom', label: 'EOM', color: '#43a047' }],
    levels: zeroLevel(),
    format: 4,
    warmup: (p) => len(p, 'length') + 1,
    compute: (c) => {
      const b = c.bars;
      const raw = c.tmp('raw');
      const hl2 = c.src('hl2');
      each(c, raw, (i) => (b[i].volume ? (N(c.p, 'divisor') * change(hl2, i) * (b[i].high - b[i].low)) / b[i].volume : NaN));
      ma(c, c.out('eom'), at(raw), len(c.p, 'length'), 'sma');
    },
  },
  {
    type: 'pvt',
    name: 'Price Volume Trend',
    short: 'PVT',
    description: 'Tendência preço-volume (PVT): volume acumulado pela variação do preço',
    overlay: false,
    inputs: [],
    defaults: {},
    plots: [{ key: 'pvt', label: 'PVT', color: BLUE }],
    format: 'volume',
    warmup: () => 0,
    compute: (c) => {
      const b = c.bars;
      cumInto(c, c.out('pvt'), (i) => (i === 0 ? 0 : ((b[i].close - b[i - 1].close) / b[i - 1].close) * b[i].volume));
    },
  },
];
