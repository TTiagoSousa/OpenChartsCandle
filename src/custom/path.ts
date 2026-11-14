/** SVG path data → absolute commands (M, L, C, Q, Z), bounds and flattening. Pure, no DOM. */

export type CustomPathCommand = ['M', number, number] | ['L', number, number] | ['C', number, number, number, number, number, number] | ['Q', number, number, number, number] | ['Z'];

const ARGS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

/** Split a `d` string into commands with their numbers (arc flags may be written without spaces). */
function tokenize(d: string): [string, number[]][] {
  const out: [string, number[]][] = [];
  let i = 0;
  const n = d.length;
  const isSep = (c: string): boolean => c === ' ' || c === ',' || c === '\n' || c === '\t' || c === '\r';
  let cmd = '';
  let args: number[] = [];
  const readNumber = (): number | null => {
    while (i < n && isSep(d[i])) i++;
    const m = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(d.slice(i, i + 40));
    if (!m) return null;
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const readFlag = (): number | null => {
    while (i < n && isSep(d[i])) i++;
    if (d[i] === '0' || d[i] === '1') return +d[i++];
    return null;
  };
  while (i < n) {
    const c = d[i];
    if (isSep(c)) {
      i++;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      if (!(c.toLowerCase() in ARGS)) throw new Error(`path: unknown command ${c}`);
      cmd = c;
      i++;
      const k = ARGS[c.toLowerCase()];
      if (k === 0) {
        out.push([cmd, []]);
        continue;
      }
    }
    if (!cmd) throw new Error('path: must start with a command');
    const k = ARGS[cmd.toLowerCase()];
    args = [];
    for (let j = 0; j < k; j++) {
      const v = cmd.toLowerCase() === 'a' && (j === 3 || j === 4) ? readFlag() : readNumber();
      if (v === null) {
        if (j === 0) return out;
        throw new Error('path: missing numbers');
      }
      args.push(v);
    }
    out.push([cmd, args]);
    // a moveto followed by more pairs = lineto
    if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
  }
  return out;
}

/** Arc (endpoint form) → cubic Béziers (≤ 90° each). */
function arcToCubics(x1: number, y1: number, rx: number, ry: number, phiDeg: number, large: number, sweep: number, x2: number, y2: number): CustomPathCommand[] {
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return [['L', x2, y2]];
  const phi = (phiDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) {
    rx *= Math.sqrt(lam);
    ry *= Math.sqrt(lam);
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let co = Math.sqrt(Math.max(0, num / den));
  if (large === sweep) co = -co;
  const cxp = (co * rx * y1p) / ry;
  const cyp = (-co * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number): number => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  else if (sweep && dt < 0) dt += 2 * Math.PI;
  const segs = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const step = dt / segs;
  const k = (4 / 3) * Math.tan(step / 4);
  const out: CustomPathCommand[] = [];
  const pt = (t: number): [number, number, number, number] => {
    const ct = Math.cos(t);
    const st = Math.sin(t);
    // point and derivative on the ellipse, rotated
    const ex = rx * ct;
    const ey = ry * st;
    const dxx = -rx * st;
    const dyy = ry * ct;
    return [cx + cos * ex - sin * ey, cy + sin * ex + cos * ey, cos * dxx - sin * dyy, sin * dxx + cos * dyy];
  };
  let t = t1;
  for (let s = 0; s < segs; s++) {
    const [ax, ay, adx, ady] = pt(t);
    const [bx, by, bdx, bdy] = pt(t + step);
    out.push(['C', ax + k * adx, ay + k * ady, bx - k * bdx, by - k * bdy, bx, by]);
    t += step;
  }
  // land exactly on the end point
  const last = out[out.length - 1] as ['C', number, number, number, number, number, number];
  last[5] = x2;
  last[6] = y2;
  return out;
}

/** Parse SVG path data into absolute M / L / C / Q / Z commands (H, V, S, T and A are converted). */
export function customParsePath(d: string): CustomPathCommand[] {
  const out: CustomPathCommand[] = [];
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let lastC: [number, number] | null = null;
  let lastQ: [number, number] | null = null;
  for (const [c, a] of tokenize(d)) {
    const rel = c === c.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    let nextC: [number, number] | null = null;
    let nextQ: [number, number] | null = null;
    switch (c.toUpperCase()) {
      case 'M':
        x = a[0] + ox;
        y = a[1] + oy;
        sx = x;
        sy = y;
        out.push(['M', x, y]);
        break;
      case 'L':
        x = a[0] + ox;
        y = a[1] + oy;
        out.push(['L', x, y]);
        break;
      case 'H':
        x = a[0] + (rel ? x : 0);
        out.push(['L', x, y]);
        break;
      case 'V':
        y = a[0] + (rel ? y : 0);
        out.push(['L', x, y]);
        break;
      case 'C': {
        const p = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy, a[4] + ox, a[5] + oy];
        out.push(['C', p[0], p[1], p[2], p[3], p[4], p[5]]);
        nextC = [p[2], p[3]];
        x = p[4];
        y = p[5];
        break;
      }
      case 'S': {
        const c1x: number = lastC ? 2 * x - lastC[0] : x;
        const c1y: number = lastC ? 2 * y - lastC[1] : y;
        const p = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
        out.push(['C', c1x, c1y, p[0], p[1], p[2], p[3]]);
        nextC = [p[0], p[1]];
        x = p[2];
        y = p[3];
        break;
      }
      case 'Q': {
        const p = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
        out.push(['Q', p[0], p[1], p[2], p[3]]);
        nextQ = [p[0], p[1]];
        x = p[2];
        y = p[3];
        break;
      }
      case 'T': {
        const qx: number = lastQ ? 2 * x - lastQ[0] : x;
        const qy: number = lastQ ? 2 * y - lastQ[1] : y;
        const px = a[0] + ox;
        const py = a[1] + oy;
        out.push(['Q', qx, qy, px, py]);
        nextQ = [qx, qy];
        x = px;
        y = py;
        break;
      }
      case 'A': {
        const ex = a[5] + ox;
        const ey = a[6] + oy;
        out.push(...arcToCubics(x, y, a[0], a[1], a[2], a[3], a[4], ex, ey));
        x = ex;
        y = ey;
        break;
      }
      case 'Z':
        out.push(['Z']);
        x = sx;
        y = sy;
        break;
    }
    lastC = nextC;
    lastQ = nextQ;
  }
  return out;
}

/** Replay commands on a canvas path, with every point mapped by `f`. */
export function customTracePath(ctx: Pick<CanvasRenderingContext2D, 'moveTo' | 'lineTo' | 'bezierCurveTo' | 'quadraticCurveTo' | 'closePath'>, cmds: CustomPathCommand[], f: (x: number, y: number) => [number, number] = (x, y) => [x, y]): void {
  for (const c of cmds) {
    if (c[0] === 'M') ctx.moveTo(...f(c[1], c[2]));
    else if (c[0] === 'L') ctx.lineTo(...f(c[1], c[2]));
    else if (c[0] === 'C') {
      const [a, b] = f(c[1], c[2]);
      const [p, q] = f(c[3], c[4]);
      const [x, y] = f(c[5], c[6]);
      ctx.bezierCurveTo(a, b, p, q, x, y);
    } else if (c[0] === 'Q') {
      const [a, b] = f(c[1], c[2]);
      const [x, y] = f(c[3], c[4]);
      ctx.quadraticCurveTo(a, b, x, y);
    } else ctx.closePath();
  }
}

/** Sub-paths as polylines (curves sampled in `steps` segments). */
export function customFlattenPath(cmds: CustomPathCommand[], steps = 8): { points: [number, number][]; closed: boolean }[] {
  const out: { points: [number, number][]; closed: boolean }[] = [];
  let cur: { points: [number, number][]; closed: boolean } | null = null;
  let x = 0;
  let y = 0;
  const start = (px: number, py: number): void => {
    cur = { points: [[px, py]], closed: false };
    out.push(cur);
  };
  for (const c of cmds) {
    if (c[0] === 'M') {
      x = c[1];
      y = c[2];
      start(x, y);
      continue;
    }
    if (!cur) start(x, y);
    const pts = (cur as unknown as { points: [number, number][] }).points;
    if (c[0] === 'L') {
      x = c[1];
      y = c[2];
      pts.push([x, y]);
    } else if (c[0] === 'C') {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        pts.push([u * u * u * x + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5], u * u * u * y + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6]]);
      }
      x = c[5];
      y = c[6];
    } else if (c[0] === 'Q') {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        pts.push([u * u * x + 2 * u * t * c[1] + t * t * c[3], u * u * y + 2 * u * t * c[2] + t * t * c[4]]);
      }
      x = c[3];
      y = c[4];
    } else {
      (cur as unknown as { closed: boolean }).closed = true;
      const p0 = pts[0];
      x = p0[0];
      y = p0[1];
      cur = null;
    }
  }
  return out.filter((s) => s.points.length > 1);
}

/** Bounding box of the path (curves sampled). */
export function customPathBounds(cmds: CustomPathCommand[]): { x: number; y: number; width: number; height: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const s of customFlattenPath(cmds, 12))
    for (const [x, y] of s.points) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  if (!Number.isFinite(x0)) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}
