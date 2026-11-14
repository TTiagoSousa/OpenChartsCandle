/**
 * Statistics for scatter plots (no DOM): regressions, k-means clustering, convex hulls and
 * the beeswarm layout of jittered categories. Testable on their own.
 */
import type { ScatterRegressionType } from './types';

export interface Regression {
  type: ScatterRegressionType;
  /** linear / polynomial: [c0, c1, c2…] of c0 + c1·x + c2·x²…; exponential: [a, b] of a·e^(b·x); logarithmic: [a, b] of a + b·ln(x) */
  coefficients: number[];
  predict: (x: number) => number;
  /** e.g. 'y = 0.5x + 3' */
  expression: string;
  /** Coefficient of determination (0–1) */
  r2: number;
}

const num = (v: number): string => {
  const a = Math.abs(v);
  const s = a !== 0 && (a >= 1e5 || a < 1e-3) ? v.toExponential(2) : String(+v.toFixed(a >= 100 ? 1 : a >= 1 ? 3 : 4));
  return s;
};
const SUP = ['', '', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

/** Solve A·x = b (Gaussian elimination with partial pivoting). */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / d;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-12));
}

/** Least squares polynomial c0 + c1·x + … of the given order. */
function polyFit(xs: number[], ys: number[], order: number): number[] {
  const m = order + 1;
  const A = Array.from({ length: m }, () => new Array(m).fill(0));
  const b = new Array(m).fill(0);
  for (let i = 0; i < xs.length; i++) {
    const pw = [1];
    for (let k = 1; k < 2 * m; k++) pw.push(pw[k - 1] * xs[i]);
    for (let r = 0; r < m; r++) {
      b[r] += pw[r] * ys[i];
      for (let c = 0; c < m; c++) A[r][c] += pw[r + c];
    }
  }
  return solve(A, b);
}

/**
 * Fit a curve to [x, y] points: 'linear', 'exponential' (y > 0), 'logarithmic' (x > 0) or
 * 'polynomial' (order 2 by default).
 */
export function regression(type: ScatterRegressionType, points: [number, number][], order = 2): Regression {
  let pts = points.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (type === 'exponential') pts = pts.filter(([, y]) => y > 0);
  if (type === 'logarithmic') pts = pts.filter(([x]) => x > 0);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  let coefficients: number[];
  let predict: (x: number) => number;
  let expression: string;
  if (type === 'exponential') {
    const [la, b] = polyFit(xs, ys.map(Math.log), 1);
    const a = Math.exp(la);
    coefficients = [a, b];
    predict = (x) => a * Math.exp(b * x);
    expression = `y = ${num(a)}e^(${num(b)}x)`;
  } else if (type === 'logarithmic') {
    const [a, b] = polyFit(xs.map(Math.log), ys, 1);
    coefficients = [a, b];
    predict = (x) => a + b * Math.log(x);
    expression = `y = ${num(a)} ${b < 0 ? '-' : '+'} ${num(Math.abs(b))}ln(x)`;
  } else {
    const n = type === 'linear' ? 1 : Math.max(1, Math.min(9, Math.round(order)));
    coefficients = polyFit(xs, ys, Math.min(n, Math.max(1, pts.length - 1)));
    const c = coefficients;
    predict = (x) => c.reduceRight((acc, k) => acc * x + k, 0);
    const terms = c
      .map((k, i) => ({ k, i }))
      .reverse()
      .filter(({ k }) => Math.abs(k) > 1e-12);
    expression =
      'y = ' +
      (terms
        .map(({ k, i }, j) => {
          const v = num(Math.abs(k));
          const body = i === 0 ? v : `${v === '1' ? '' : v}x${SUP[i] ?? `^${i}`}`;
          return j === 0 ? (k < 0 ? '-' : '') + body : `${k < 0 ? ' - ' : ' + '}${body}`;
        })
        .join('') || '0');
  }
  const mean = ys.reduce((a, v) => a + v, 0) / (ys.length || 1);
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < xs.length; i++) {
    ssRes += (ys[i] - predict(xs[i])) ** 2;
    ssTot += (ys[i] - mean) ** 2;
  }
  return { type, coefficients, predict, expression, r2: ssTot ? Math.max(0, 1 - ssRes / ssTot) : 1 };
}

export interface KMeansStep {
  centroids: number[][];
  /** cluster of each point */
  labels: number[];
}

export interface KMeansResult extends KMeansStep {
  /** Every iteration, from the first guess to the end (to animate the process) */
  steps: KMeansStep[];
}

/** Deterministic random numbers (for repeatable clusters). */
function seeded(seed: number): () => number {
  let s = Math.max(1, Math.floor(seed)) % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const dist2 = (a: number[], b: number[]): number => a.reduce((acc, v, i) => acc + (v - b[i]) ** 2, 0);

/** k-means clustering (k-means++ start) of points with any number of dimensions. */
export function kmeans(points: number[][], k: number, opts: { maxIterations?: number; seed?: number } = {}): KMeansResult {
  const rnd = seeded(opts.seed ?? 7);
  const n = points.length;
  k = Math.max(1, Math.min(k, n));
  if (!n) return { centroids: [], labels: [], steps: [] };
  // k-means++: each new center far from the others
  const centroids = [points[Math.floor(rnd() * n)].slice()];
  while (centroids.length < k) {
    const d = points.map((p) => Math.min(...centroids.map((c) => dist2(p, c))));
    let r = rnd() * d.reduce((a, v) => a + v, 0);
    let i = 0;
    while (i < n - 1 && (r -= d[i]) > 0) i++;
    centroids.push(points[i].slice());
  }
  const steps: KMeansStep[] = [];
  let labels: number[] = [];
  for (let it = 0; it < (opts.maxIterations ?? 50); it++) {
    const next = points.map((p) => {
      let best = 0;
      for (let c = 1; c < k; c++) if (dist2(p, centroids[c]) < dist2(p, centroids[best])) best = c;
      return best;
    });
    const changed = next.some((l, i) => l !== labels[i]);
    labels = next;
    steps.push({ centroids: centroids.map((c) => c.slice()), labels: labels.slice() });
    if (!changed) break;
    for (let c = 0; c < k; c++) {
      const mine = points.filter((_, i) => labels[i] === c);
      if (mine.length) centroids[c] = mine[0].map((_, d) => mine.reduce((a, p) => a + p[d], 0) / mine.length);
    }
  }
  const last = steps[steps.length - 1];
  return { centroids: last.centroids, labels: last.labels, steps };
}

/** Convex hull (counter-clockwise) of 2D points. */
export function convexHull(points: [number, number][]): [number, number][] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: number[], a: number[], b: number[]): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p[i]) <= 0) upper.pop();
    upper.push(p[i]);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/**
 * Sideways offsets (px) that keep circles of the given radii from overlapping when they share a
 * line: each point goes to the free spot closest to the middle (beeswarm). `along` are the positions
 * along the line (px); offsets stay within ±maxOffset (overlaps are allowed beyond it).
 */
export function beeswarm(along: number[], radii: number[], maxOffset: number): number[] {
  const order = along.map((_, i) => i).sort((a, b) => along[a] - along[b]);
  const out = new Array(along.length).fill(0);
  const placed: number[] = [];
  for (const i of order) {
    // candidate offsets: 0 and the touching spots on each side of every close neighbour
    const near = placed.filter((j) => Math.abs(along[j] - along[i]) < radii[i] + radii[j]);
    const cands = [0];
    for (const j of near) {
      const d = radii[i] + radii[j] + 0.5;
      const dy = along[j] - along[i];
      const dx = Math.sqrt(Math.max(0, d * d - dy * dy));
      cands.push(out[j] + dx, out[j] - dx);
    }
    cands.sort((a, b) => Math.abs(a) - Math.abs(b));
    const ok = (o: number): boolean =>
      near.every((j) => (out[j] - o) ** 2 + (along[j] - along[i]) ** 2 >= (radii[i] + radii[j]) ** 2 - 0.01);
    const free = cands.find((o) => Math.abs(o) <= maxOffset && ok(o));
    out[i] = free ?? cands.find((o) => Math.abs(o) <= maxOffset) ?? 0;
    placed.push(i);
  }
  return out;
}
