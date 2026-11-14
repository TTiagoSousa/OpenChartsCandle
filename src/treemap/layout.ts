/** Rectangle in px. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const worst = (sum: number, min: number, max: number, side: number): number => {
  const s2 = sum * sum;
  const w2 = side * side;
  return Math.max((w2 * max) / s2, s2 / (w2 * min));
};

/**
 * Squarified treemap (Bruls, Huizing, van Wijk): splits `box` into rectangles with areas
 * proportional to `values`, as close to squares as possible. Keeps the order of `values`
 * (sort them descending for the best result); values ≤ 0 get an empty box.
 */
export function squarify(values: number[], box: Box): Box[] {
  const out: Box[] = values.map(() => ({ x: box.x, y: box.y, w: 0, h: 0 }));
  const idx = values.map((_, i) => i).filter((i) => values[i] > 0);
  const total = idx.reduce((s, i) => s + values[i], 0);
  if (!(total > 0) || box.w <= 0 || box.h <= 0) return out;
  const scale = (box.w * box.h) / total;
  const area = values.map((v) => Math.max(0, v) * scale);
  let { x, y, w, h } = box;
  let i = 0;
  while (i < idx.length) {
    const side = Math.min(w, h);
    let sum = area[idx[i]];
    let min = sum;
    let max = sum;
    let ratio = worst(sum, min, max, side);
    let j = i + 1;
    for (; j < idx.length; j++) {
      const a = area[idx[j]];
      const r = worst(sum + a, Math.min(min, a), Math.max(max, a), side);
      if (r > ratio) break;
      sum += a;
      min = Math.min(min, a);
      max = Math.max(max, a);
      ratio = r;
    }
    // last row takes all the room left (no gaps from rounding)
    const last = j >= idx.length;
    if (w >= h) {
      const cw = last ? w : sum / h;
      let yy = y;
      for (let k = i; k < j; k++) {
        const hh = k === j - 1 ? y + h - yy : area[idx[k]] / cw;
        out[idx[k]] = { x, y: yy, w: cw, h: hh };
        yy += hh;
      }
      x += cw;
      w -= cw;
    } else {
      const rh = last ? h : sum / w;
      let xx = x;
      for (let k = i; k < j; k++) {
        const ww = k === j - 1 ? x + w - xx : area[idx[k]] / rh;
        out[idx[k]] = { x: xx, y, w: ww, h: rh };
        xx += ww;
      }
      y += rh;
      h -= rh;
    }
    i = j;
  }
  return out;
}

/** Shrink a box on every side (never below zero size). */
export function inset(b: Box, d: number): Box {
  const dx = Math.min(d, b.w / 2);
  const dy = Math.min(d, b.h / 2);
  return { x: b.x + dx, y: b.y + dy, w: b.w - 2 * dx, h: b.h - 2 * dy };
}
