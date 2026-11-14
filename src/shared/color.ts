/** Small color helpers (no DOM needed for hex / rgb / hsl strings). */

export type RGBA = [r: number, g: number, b: number, a: number];

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export function parseColor(c: string): RGBA {
  const s = c.trim().toLowerCase();
  if (s[0] === '#') {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1];
  }
  const m = s.match(/^(rgba?|hsla?)\(([^)]+)\)$/);
  if (m) {
    const p = m[2].split(/[\s,/]+/).filter(Boolean).map((x) => parseFloat(x));
    const a = p[3] ?? 1;
    if (m[1].startsWith('rgb')) return [p[0], p[1], p[2], a];
    const [r, g, b] = hslToRgb(p[0] / 360, p[1] / 100, p[2] / 100);
    return [r, g, b, a];
  }
  if (s === 'transparent') return [0, 0, 0, 0];
  // named colors: let the browser resolve them
  if (typeof document !== 'undefined') {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = s;
      if (ctx.fillStyle !== s) return parseColor(ctx.fillStyle);
    }
  }
  return [128, 128, 128, 1];
}

export function toColor([r, g, b, a]: RGBA): string {
  const R = Math.round(r);
  const G = Math.round(g);
  const B = Math.round(b);
  return a >= 1 ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${+a.toFixed(3)})`;
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number): number => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** Mix two colors (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const A = parseColor(a);
  const B = parseColor(b);
  return toColor(A.map((v, i) => v + (B[i] - v) * t) as RGBA);
}

/** Color at t (0–1) along a list of colors. */
export function gradientAt(colors: string[], t: number): string {
  if (colors.length === 1) return colors[0];
  const x = clamp01(t) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(x));
  return mix(colors[i], colors[i + 1], x - i);
}

/** Set HSL saturation / lightness / alpha of a color (undefined keeps it). */
export function adjust(c: string, sat?: number, light?: number, alpha?: number): string {
  const [r, g, b, a] = parseColor(c);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [R, G, B] = hslToRgb(h, sat === undefined ? s : clamp01(sat), light === undefined ? l : clamp01(light));
  return toColor([R, G, B, alpha === undefined ? a : clamp01(alpha)]);
}

/** Lighter (amount > 0) or darker (amount < 0) by changing the HSL lightness. */
export function shade(c: string, amount: number): string {
  const [r, g, b, a] = parseColor(c);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [R, G, B] = hslToRgb(h, s, clamp01(l + amount));
  return toColor([R, G, B, a]);
}

/** Relative luminance 0 (black) – 1 (white). */
export function luminance(c: string): number {
  const [r, g, b] = parseColor(c).map((v, i) => (i < 3 ? v / 255 : v));
  const f = (v: number): number => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
