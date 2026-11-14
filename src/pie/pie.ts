import { DEFAULT_COLORS, LabelBox, SliceGeom, computeAngles, fit, layoutOutsideLabels, normAngle, prepareSlices } from './layout';
import type { PieDatum, PieEvent, PieLabelContent, PieOptions, PiePattern, PieRichRun, PieRing, PieSlice, PieTheme } from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';
const DEG = Math.PI / 180;

export const pieDarkTheme: PieTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  line: '#5d606b',
  sliceBorder: '#131722',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const pieLightTheme: PieTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  line: '#b2b5be',
  sliceBorder: '#ffffff',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

/** Textures used in order with `patterns: true`. */
export const PIE_PATTERNS: PiePattern[] = ['diagonal', 'dots', 'stripes', 'cross', 'grid', 'checker', 'zigzag'];

type LabelOpts = {
  show: boolean;
  position: 'inside' | 'outside' | 'auto';
  content: PieLabelContent;
  minPercent: number;
  fontSize: number;
  fontWeight: number;
  color?: string;
  insideColor?: string;
  lineLength: number;
  radialLength: number;
  alignTo: 'line' | 'none' | 'edge';
  edgeDistance: number;
  lineSmooth: boolean;
  showLine: boolean;
  rich?: (s: PieSlice) => PieRichRun[][];
};

interface Resolved {
  background: string;
  padding: number;
  scale: number;
  emptyText: string;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  padAngle: number;
  cornerRadius: number;
  rose: boolean | 'area' | 'radius';
  clockwise: boolean;
  minSliceAngle: number;
  gradient: boolean;
  patterns: PiePattern[] | null;
  shadow: { color: string; blur: number; offsetY: number } | false;
  hoverDim: number;
  borderWidth: number;
  sort: 'none' | 'desc' | 'asc';
  groupBelow: number;
  othersLabel: string;
  colors: string[];
  labels: LabelOpts;
  legend: {
    show: boolean;
    position: 'right' | 'bottom' | 'left' | 'top';
    interactive: boolean;
    values: boolean;
    marker: 'square' | 'circle' | 'line';
    fontSize: number;
    align: 'start' | 'center' | 'end';
  };
  tooltip: { show: boolean; formatter?: (s: PieSlice, total: number) => string; followCursor: boolean; showValue: boolean; showPercent: boolean };
  center: {
    show: boolean;
    title: string;
    value?: string | ((total: number) => string);
    followHover: boolean;
    valueColor?: string;
    titleColor?: string;
    fontScale: number;
  };
  hoverOffset: number;
  selectable: boolean;
  selectOffset: number;
  valueFormatter: (v: number) => string;
  percentFormatter: (p: number) => string;
  theme: PieTheme;
  /** gaps are cut out (transparent background) instead of painted */
  cutGaps: boolean;
  duration: number;
  animType: 'sweep' | 'scale';
  easing: 'cubic' | 'elastic';
  stagger: number | 'random';
}

const labelDefaults = (l: PieOptions['labels'] = {}): LabelOpts => ({
  show: true,
  position: 'auto',
  content: 'percent',
  minPercent: 3,
  fontSize: 12,
  fontWeight: 600,
  lineLength: 18,
  radialLength: 12,
  alignTo: 'line',
  edgeDistance: 10,
  lineSmooth: false,
  showLine: true,
  ...l,
});

function resolve(o: PieOptions): Resolved {
  const startAngle = o.startAngle ?? -90;
  const base = o.theme === 'light' ? pieLightTheme : pieDarkTheme;
  const theme: PieTheme = typeof o.theme === 'object' ? { ...base, ...o.theme } : { ...base };
  if (o.background !== undefined) theme.background = o.background;
  const explicitBorder = typeof o.theme === 'object' && !!o.theme.sliceBorder;
  if (!explicitBorder) theme.sliceBorder = theme.background;
  const cutGaps = !explicitBorder && theme.background === 'transparent';
  const inner = Math.min(0.95, Math.max(0, o.innerRadius ?? 0));
  const anim = o.animation ?? true;
  const a = typeof anim === 'object' ? anim : {};
  const shadow = o.shadow ? { color: 'rgba(0,0,0,0.45)', blur: 12, offsetY: 3, ...o.shadow } : false;
  return {
    background: theme.background,
    padding: Math.max(0, o.padding ?? 0),
    scale: Math.min(1, Math.max(0.3, o.scale ?? 1)),
    emptyText: o.emptyText ?? 'Sem dados',
    innerRadius: inner,
    outerRadius: Math.min(1, Math.max(0.05, o.outerRadius ?? 1)),
    startAngle,
    endAngle: o.endAngle ?? startAngle + 360,
    padAngle: o.padAngle ?? 0,
    cornerRadius: o.cornerRadius ?? 0,
    rose: o.rose ?? false,
    clockwise: o.clockwise ?? true,
    minSliceAngle: Math.max(0, o.minSliceAngle ?? 0),
    gradient: o.gradient ?? false,
    patterns: o.patterns === true ? PIE_PATTERNS : Array.isArray(o.patterns) && o.patterns.length ? o.patterns : null,
    shadow,
    hoverDim: Math.min(1, Math.max(0, o.hoverDim ?? 0.55)),
    borderWidth: o.borderWidth ?? 1,
    sort: o.sort ?? 'none',
    groupBelow: o.groupBelow ?? 0,
    othersLabel: o.othersLabel ?? 'Outros',
    colors: o.colors?.length ? o.colors : DEFAULT_COLORS,
    labels: labelDefaults(o.labels),
    legend: { show: true, position: 'right', interactive: true, values: true, marker: 'square', fontSize: 13, align: 'center', ...(o.legend ?? {}) },
    tooltip: { show: true, followCursor: true, showValue: true, showPercent: true, ...(o.tooltip ?? {}) },
    center: { show: inner > 0, title: 'Total', followHover: true, fontScale: 1, ...(o.center ?? {}) },
    hoverOffset: o.hoverOffset ?? 8,
    selectable: o.selectable ?? true,
    selectOffset: o.selectOffset ?? 14,
    valueFormatter: o.valueFormatter ?? ((v: number) => v.toLocaleString('pt-PT', { maximumFractionDigits: 2 })),
    percentFormatter: o.percentFormatter ?? ((p: number) => `${p.toFixed(1)}%`),
    theme,
    cutGaps,
    duration: anim === false ? 0 : (a.duration ?? 700),
    animType: a.type ?? 'sweep',
    easing: a.easing ?? 'cubic',
    stagger: a.stagger ?? 0,
  };
}

/** Mix a #rrggbb color with white (amount > 0) or black (amount < 0). */
function shade(color: string, amount: number): string {
  const m = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
  if (!m) return color;
  const t = amount > 0 ? 255 : 0;
  const a = Math.abs(amount);
  return '#' + [m[1], m[2], m[3]].map((x) => Math.round(parseInt(x, 16) + (t - parseInt(x, 16)) * a).toString(16).padStart(2, '0')).join('');
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeOutElastic = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * 2 * Math.PI) / 0.3) + 1);

/** Black or white text on top of a color (#hex, rgb() or hsl() lightness). */
function contrast(color: string): string {
  const m = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
  let rgb: number[] | null = m ? [m[1], m[2], m[3]].map((x) => parseInt(x, 16)) : null;
  if (!rgb) {
    const r = color.match(/^rgba?\(([^)]+)\)/i);
    if (r) rgb = r[1].split(/[\s,/]+/).slice(0, 3).map(Number);
    const h = color.match(/^hsla?\([^,\s]+[\s,]+[^,\s]+[\s,]+([\d.]+)%/i);
    if (h) return Number(h[1]) > 62 ? '#131722' : '#ffffff';
  }
  if (!rgb) return '#ffffff';
  const [r, g, b] = rgb;
  return 0.299 * r + 0.587 * g + 0.114 * b > 165 ? '#131722' : '#ffffff';
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Main data or one of `rings`: its own data, radii and labels. */
interface Layer {
  ring: number;
  name?: string;
  data: PieDatum[];
  inner: number;
  outer: number;
  labels: LabelOpts;
  colors: string[];
  padAngle: number;
  cornerRadius: number;
  rose: boolean | 'area' | 'radius';
  sort: 'none' | 'desc' | 'asc';
  slices: PieSlice[];
}

interface RichBlock {
  w: number;
  h: number;
  lines: { w: number; h: number; runs: { run: PieRichRun; w: number; font: string; size: number; pad: number }[] }[];
}

const keyOf = (ring: number, id: string): string => `${ring}|${id}`;

/**
 * Pie / donut / half-donut / rose chart with nested rings, tooltip, interactive legend,
 * inside/outside labels (rich text, three alignments), center text, textures,
 * hover & selection and animations.
 */
export class PieChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private plot: HTMLElement;
  private legendEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private titleEl: HTMLElement;
  private opts: PieOptions;
  private o: Resolved;
  private layers: Layer[] = [];
  private hidden = new Set<string>();
  /** selected slices by key (ring|id) */
  private selected = new Set<string>();
  private hoverKey: string | null = null;
  /** current (animated) geometry per slice key */
  private geom = new Map<string, SliceGeom>();
  private from = new Map<string, SliceGeom>();
  private target = new Map<string, SliceGeom>();
  private delays = new Map<string, number>();
  private offsets = new Map<string, number>();
  private patternCache = new Map<string, CanvasPattern | null>();
  private animStart = 0;
  private raf = 0;
  private lastFrame = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private titleH = 0;
  private layoutCache: { cx: number; cy: number; radius: number } = { cx: 0, cy: 0, radius: 0 };
  private handlers = new Map<PieEvent, Set<(s: PieSlice | null) => void>>();
  private ro: ResizeObserver;
  private firstData = true;

  constructor(container: HTMLElement, options: PieOptions = {}) {
    this.opts = { ...options };
    this.o = resolve(this.opts);
    this.root = container;
    container.classList.add('pc-root');
    this.plot = document.createElement('div');
    this.plot.className = 'pc-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pc-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'pc-tooltip';
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'pc-title';
    this.legendEl = document.createElement('ul');
    this.legendEl.className = 'pc-legend';
    this.plot.append(this.canvas, this.titleEl, this.tooltipEl);
    container.append(this.plot, this.legendEl);
    this.applyDomOptions();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plot);
    this.resize();
    this.recompute(true);
  }

  // ------------------------------------------------------------------ public API

  /** Replace the data (animated). */
  setData(data: PieDatum[]): void {
    this.opts.data = data;
    this.o = resolve(this.opts);
    const keys = new Set([...data, ...(this.opts.rings ?? []).flatMap((r) => r.data)].map((d) => d.id ?? d.label));
    for (const k of [...this.hidden]) if (!keys.has(k) && k !== '__others__') this.hidden.delete(k);
    this.recompute(true);
  }

  /**
   * Change options after creation. Shape changes are animated unless `animate` is false
   * (use false for continuous input such as sliders).
   */
  setOptions(patch: PieOptions, animate = true): void {
    this.opts = { ...this.opts, ...patch };
    this.o = resolve(this.opts);
    this.patternCache.clear();
    this.applyDomOptions();
    this.recompute(animate);
  }

  /** Slices of the main data as currently shown (after sorting/grouping), in drawing order. */
  get slices(): PieSlice[] {
    return (this.layers[0]?.slices ?? []).map((s) => ({ ...s }));
  }

  /** Sum of the visible slices of the main data. */
  get total(): number {
    return this.layerTotal(0);
  }

  /** Show/hide a slice in every ring (like clicking the legend). */
  toggle(id: string, hidden?: boolean): void {
    const h = hidden ?? !this.hidden.has(id);
    if (h) this.hidden.add(id);
    else this.hidden.delete(id);
    this.recompute(true);
    this.emit('toggle', this.findSlice(id));
  }

  /** Select a slice of the main data (moves it out), or null to clear. */
  select(id: string | null): void {
    const layer = id === null ? 0 : (this.layers.find((l) => l.slices.some((s) => s.id === id))?.ring ?? 0);
    this.selectKey(id === null ? null : keyOf(layer, id));
  }

  /** Highlight a slice as if hovered (null to clear). */
  highlight(id: string | null): void {
    const s = id === null ? null : this.findSlice(id);
    this.setHover(s ? keyOf(s.ring, s.id) : null);
  }

  on(event: PieEvent, handler: (s: PieSlice | null) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  /** PNG data URL of the chart (without legend). */
  screenshot(): string {
    this.draw();
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('pc-root', 'pc-legend-right', 'pc-legend-left', 'pc-legend-top', 'pc-legend-bottom');
    this.plot.remove();
    this.legendEl.remove();
  }

  // ------------------------------------------------------------------ internals

  private findSlice(id: string): PieSlice | null {
    for (const l of this.layers) {
      const s = l.slices.find((x) => x.id === id);
      if (s) return s;
    }
    return null;
  }

  private sliceByKey(key: string | null): PieSlice | null {
    if (!key) return null;
    const i = key.indexOf('|');
    const ring = +key.slice(0, i);
    const id = key.slice(i + 1);
    return this.layers[ring]?.slices.find((s) => s.id === id) ?? null;
  }

  private layerTotal(ring: number): number {
    return (this.layers[ring]?.slices ?? []).reduce((s, x) => s + (x.hidden ? 0 : x.value), 0);
  }

  private emit(e: PieEvent, s: PieSlice | null): void {
    this.handlers.get(e)?.forEach((h) => h(s ? { ...s } : null));
  }

  private selectKey(key: string | null): void {
    const was = key !== null && this.selected.has(key);
    this.selected.clear();
    if (key !== null && !was) this.selected.add(key);
    this.recompute(false);
    this.emit('select', key && !was ? this.sliceByKey(key) : null);
  }

  private applyDomOptions(): void {
    const t = this.o.theme;
    const pos = this.o.legend.position;
    const lg = this.o.legend;
    this.root.classList.remove('pc-legend-right', 'pc-legend-left', 'pc-legend-top', 'pc-legend-bottom');
    this.root.classList.add(`pc-legend-${pos}`);
    this.legendEl.style.display = lg.show ? '' : 'none';
    this.legendEl.className = `pc-legend pc-legend--${lg.marker} pc-legend--align-${lg.align}`;
    this.legendEl.style.fontSize = `${lg.fontSize}px`;
    const vars: Record<string, string> = {
      '--pc-bg': t.background,
      '--pc-text': t.text,
      '--pc-muted': t.muted,
      '--pc-tt-bg': t.tooltipBg,
      '--pc-tt-text': t.tooltipText,
      '--pc-tt-border': t.tooltipBorder,
      '--pc-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    // title
    const ti = this.opts.title;
    const title = typeof ti === 'string' ? { text: ti } : ti;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.innerHTML = `<div class="pc-title__text">${esc(title.text)}</div>${title.subtext ? `<div class="pc-title__sub">${esc(title.subtext)}</div>` : ''}`;
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.style.color = title.color ?? '';
    }
    this.titleH = title ? this.titleEl.offsetHeight : 0;
  }

  private buildLayers(): Layer[] {
    const o = this.o;
    const main: Layer = {
      ring: 0,
      name: this.opts.seriesName,
      data: this.opts.data ?? [],
      inner: o.innerRadius,
      outer: o.outerRadius,
      labels: o.labels,
      colors: o.colors,
      padAngle: o.padAngle,
      cornerRadius: o.cornerRadius,
      rose: o.rose,
      sort: o.sort,
      slices: [],
    };
    const rings = (this.opts.rings ?? []).map(
      (r: PieRing, i): Layer => ({
        ring: i + 1,
        name: r.name,
        data: r.data,
        inner: Math.max(0, Math.min(1, r.innerRadius)),
        outer: Math.max(0, Math.min(1, r.outerRadius)),
        labels: labelDefaults({ ...this.opts.labels, ...r.labels }),
        colors: r.colors?.length ? r.colors : o.colors,
        padAngle: r.padAngle ?? o.padAngle,
        cornerRadius: r.cornerRadius ?? o.cornerRadius,
        rose: r.rose ?? false,
        sort: r.sort ?? o.sort,
        slices: [],
      }),
    );
    return [main, ...rings];
  }

  private recompute(animate: boolean): void {
    const o = this.o;
    this.layers = this.buildLayers();
    const start = o.startAngle * DEG;
    this.from = new Map();
    this.target = new Map();
    this.delays = new Map();
    let order = 0;
    for (const l of this.layers) {
      const sel = new Set([...this.selected].filter((k) => k.startsWith(`${l.ring}|`)).map((k) => k.slice(k.indexOf('|') + 1)));
      l.slices = prepareSlices(
        l.data,
        { sort: l.sort, groupBelow: l.ring === 0 ? o.groupBelow : 0, othersLabel: o.othersLabel, colors: l.colors },
        this.hidden,
        sel,
        l.ring,
        l.name,
      );
      const geoms = computeAngles(l.slices, start, o.endAngle * DEG, l.rose, l.ring === 0 ? o.minSliceAngle * DEG : 0, o.clockwise);
      l.slices.forEach((s, i) => {
        const key = keyOf(l.ring, s.id);
        const g = geoms[i];
        this.target.set(key, g);
        const cur = this.geom.get(key);
        if (cur) this.from.set(key, { ...cur });
        else if (this.firstData) this.from.set(key, o.animType === 'scale' ? { a0: g.a0, a1: g.a1, r: 0 } : { a0: start, a1: start, r: g.r });
        else this.from.set(key, { a0: g.a0, a1: g.a0, r: g.r }); // new slice grows from its place
        if (this.firstData && o.stagger) this.delays.set(key, o.stagger === 'random' ? Math.random() * 400 : order * o.stagger);
        order++;
        if (!this.offsets.has(key)) this.offsets.set(key, 0);
      });
    }
    if (this.layers.some((l) => l.slices.length)) this.firstData = false;
    if (!animate || o.duration === 0) {
      this.geom = new Map([...this.target].map(([k, v]) => [k, { ...v }]));
      this.animStart = 0;
    } else {
      this.animStart = performance.now();
    }
    this.renderLegend();
    this.canvas.setAttribute(
      'aria-label',
      (this.layers[0]?.slices ?? [])
        .filter((s) => !s.hidden)
        .map((s) => `${s.label}: ${o.valueFormatter(s.value)} (${o.percentFormatter(s.percent)})`)
        .join(', '),
    );
    this.kick();
  }

  private kick(): void {
    if (!this.raf) {
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame((t) => this.frame(t));
    }
  }

  private frame(now: number): void {
    this.raf = 0;
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    let busy = false;
    // angles / radii
    if (this.animStart) {
      const ease = this.o.easing === 'elastic' ? easeOutElastic : easeOutCubic;
      let done = true;
      this.geom = new Map();
      for (const [key, to] of this.target) {
        const fr = this.from.get(key) ?? to;
        const k = Math.max(0, Math.min(1, (now - this.animStart - (this.delays.get(key) ?? 0)) / this.o.duration));
        if (k < 1) done = false;
        const e = ease(k);
        this.geom.set(key, { a0: fr.a0 + (to.a0 - fr.a0) * e, a1: fr.a1 + (to.a1 - fr.a1) * e, r: fr.r + (to.r - fr.r) * e });
      }
      if (done) this.animStart = 0;
      else busy = true;
    }
    // hover / selection offsets (smooth)
    for (const l of this.layers)
      for (const s of l.slices) {
        const key = keyOf(l.ring, s.id);
        const target = (this.hoverKey === key ? this.o.hoverOffset : 0) + (s.selected ? this.o.selectOffset : 0);
        const cur = this.offsets.get(key) ?? 0;
        const next = Math.abs(target - cur) < 0.1 ? target : cur + (target - cur) * Math.min(1, dt * 16);
        this.offsets.set(key, next);
        if (next !== target) busy = true;
      }
    this.draw();
    if (busy) this.kick();
  }

  private resize(): void {
    const r = this.plot.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    if (this.opts.title) this.titleH = this.titleEl.offsetHeight;
    this.patternCache.clear();
    this.draw();
  }

  private labelText(s: PieSlice, content: PieLabelContent): string {
    if (typeof content === 'function') return content(s);
    const v = this.o.valueFormatter(s.value);
    const p = this.o.percentFormatter(s.percent);
    switch (content) {
      case 'value': return v;
      case 'label': return s.label;
      case 'label-percent': return `${s.label} ${p}`;
      case 'label-value': return `${s.label} ${v}`;
      default: return p;
    }
  }

  /** Text of a label as lines of runs (plain text, '\n' lines or rich). */
  private labelRuns(s: PieSlice, L: LabelOpts, outside: boolean): PieRichRun[][] {
    if (L.rich) return L.rich(s);
    const c = L.content;
    const text = outside
      ? this.labelText(s, typeof c === 'function' || c !== 'percent' ? c : 'label-percent')
      : this.labelText(s, c === 'percent' || L.position === 'inside' ? c : 'percent');
    return text.split('\n').map((t) => [{ text: t }]);
  }

  private measureRich(lines: PieRichRun[][], L: LabelOpts): RichBlock {
    const ctx = this.ctx;
    const font = this.o.theme.font;
    const out: RichBlock = { w: 0, h: 0, lines: [] };
    for (const line of lines) {
      let w = 0;
      let h = 0;
      const runs = line.map((run) => {
        const size = run.fontSize ?? L.fontSize;
        const f = `${run.fontWeight ?? L.fontWeight} ${size}px ${font}`;
        ctx.font = f;
        const pad = run.padding ?? (run.background ? 3 : 0);
        const rw = ctx.measureText(run.text).width + pad * 2;
        w += rw;
        h = Math.max(h, size * 1.3 + pad * 2);
        return { run, w: rw, font: f, size, pad };
      });
      out.lines.push({ w, h: h || L.fontSize * 1.3, runs });
      out.w = Math.max(out.w, w);
      out.h += h || L.fontSize * 1.3;
    }
    return out;
  }

  /** Draw a measured block; `x` is the left, right or middle edge depending on `align`, `y` the vertical middle. */
  private drawRich(b: RichBlock, x: number, y: number, align: 'left' | 'right' | 'center', color: string): void {
    const ctx = this.ctx;
    let top = y - b.h / 2;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (const line of b.lines) {
      let lx = align === 'left' ? x : align === 'right' ? x - line.w : x - line.w / 2;
      const my = top + line.h / 2;
      for (const r of line.runs) {
        if (r.run.background) {
          ctx.fillStyle = r.run.background;
          ctx.beginPath();
          ctx.roundRect(lx, my - r.size * 0.65 - r.pad, r.w, r.size * 1.3 + r.pad * 2, r.run.radius ?? 3);
          ctx.fill();
        }
        ctx.font = r.font;
        ctx.fillStyle = r.run.color ?? color;
        ctx.fillText(r.run.text, lx + r.pad, my + 0.5);
        lx += r.w;
      }
      top += line.h;
    }
  }

  /** Widest outside label (for the room left around the pie). */
  private outsideWidth(): number {
    let w = 0;
    for (const l of this.layers) {
      const L = l.labels;
      if (!L.show || L.position === 'inside') continue;
      for (const s of l.slices) if (!s.hidden && s.percent >= L.minPercent) w = Math.max(w, this.measureRich(this.labelRuns(s, L, true), L).w);
    }
    return w;
  }

  private geometry(): { cx: number; cy: number; radius: number } {
    const o = this.o;
    const outer = this.layers.filter((l) => l.labels.show && l.labels.position !== 'inside');
    const L = outer[0]?.labels;
    const extra = Math.max(o.hoverOffset, 0) + (this.selected.size ? o.selectOffset : 0) + 4;
    const textW = L ? Math.min(this.outsideWidth() + 6, this.width * (L.alignTo === 'edge' ? 0.22 : 0.26)) : 0;
    const margin = {
      x: (L ? textW + L.lineLength + (L.alignTo === 'line' ? 0 : L.radialLength) + (L.alignTo === 'edge' ? L.edgeDistance : 0) : 0) + extra + o.padding,
      y: (L ? 22 : 0) + extra + o.padding,
    };
    // labels never squeeze the pie below ~30% of the room (small boxes: labels may reach the edges)
    const minR = Math.min(this.width, this.height - this.titleH) * 0.3;
    margin.x = Math.max(o.padding, Math.min(margin.x, this.width / 2 - minR));
    margin.y = Math.max(o.padding, Math.min(margin.y, (this.height - this.titleH) / 2 - minR));
    const g = fit(this.width, Math.max(1, this.height - this.titleH), o.startAngle * DEG, o.endAngle * DEG, margin);
    g.cy += this.titleH;
    g.radius *= o.scale; // shrink around the same centre
    this.layoutCache = g;
    return g;
  }

  /**
   * Path of one slice with angular padding and (exact) rounded corners.
   * The shape is a single closed path, so it can be filled once (correct with
   * semi-transparent colors) and stroked/cut for borders.
   */
  private slicePath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, padAngle: number, cornerRadius: number): Path2D | null {
    const pad = Math.min(padAngle * DEG, (a1 - a0) * 0.45);
    a0 += pad / 2;
    a1 -= pad / 2;
    if (a1 - a0 <= 1e-4 || r1 - r0 <= 0.5) return null;
    const p = new Path2D();
    const span = a1 - a0;
    const full = span >= Math.PI * 2 - 1e-3;
    const P = (r: number, a: number): [number, number] => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

    // largest corner radius that still fits this slice
    let c = Math.min(cornerRadius, (r1 - r0) / 2 - 0.5);
    const fits = (k: number): boolean => {
      if (k <= 0) return true;
      const tO = Math.asin(Math.min(1, k / (r1 - k)));
      if (2 * tO >= span * 0.98) return false;
      if (r0 > 0 && 2 * Math.asin(Math.min(1, k / (r0 + k))) >= span * 0.98) return false;
      return true;
    };
    while (c > 0.5 && !fits(c)) c *= 0.8;

    if (full || c <= 0.5) {
      if (full) {
        p.arc(cx, cy, r1, 0, Math.PI * 2);
        if (r0 > 0) p.arc(cx, cy, r0, Math.PI * 2, 0, true);
      } else {
        p.arc(cx, cy, r1, a0, a1);
        if (r0 > 0) p.arc(cx, cy, r0, a1, a0, true);
        else p.lineTo(cx, cy);
        p.closePath();
      }
      return p;
    }

    /** arc on a corner circle between two tangent points, the short way round */
    const corner = (ccx: number, ccy: number, from: [number, number], to: [number, number]): void => {
      const s0 = Math.atan2(from[1] - ccy, from[0] - ccx);
      const s1 = Math.atan2(to[1] - ccy, to[0] - ccx);
      let d = s1 - s0;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      p.arc(ccx, ccy, c, s0, s1, d < 0);
    };

    // outer corners
    const dO = r1 - c;
    const tO = Math.asin(c / dO);
    const rOT = Math.sqrt(dO * dO - c * c); // tangent point on the radial edges
    const [os0x, os0y] = P(dO, a0 + tO);
    const [oe0x, oe0y] = P(dO, a1 - tO);
    const startEdge = P(rOT, a0);
    p.moveTo(startEdge[0], startEdge[1]);
    corner(os0x, os0y, startEdge, P(r1, a0 + tO));
    p.arc(cx, cy, r1, a0 + tO, a1 - tO);
    corner(oe0x, oe0y, P(r1, a1 - tO), P(rOT, a1));

    if (r0 > 0) {
      // inner corners
      const dI = r0 + c;
      const tI = Math.asin(c / dI);
      const rIT = Math.sqrt(dI * dI - c * c);
      const [ie0x, ie0y] = P(dI, a1 - tI);
      const [is0x, is0y] = P(dI, a0 + tI);
      const endInner = P(rIT, a1);
      p.lineTo(endInner[0], endInner[1]);
      corner(ie0x, ie0y, endInner, P(r0, a1 - tI));
      p.arc(cx, cy, r0, a1 - tI, a0 + tI, true);
      corner(is0x, is0y, P(r0, a0 + tI), P(rIT, a0));
    } else {
      // pie: slightly pulled-in apex so padded slices don't overlap at the centre
      const half = span / 2;
      const d = pad > 0 ? Math.min(c / Math.sin(Math.min(half, Math.PI / 2)), r1 * 0.3) : 0;
      const [ax, ay] = P(d, a0 + half);
      p.lineTo(ax, ay);
    }
    p.closePath();
    return p;
  }

  /** Texture tile for a slice color (light lines on dark colors and vice versa). */
  private pattern(kind: PiePattern, color: string): CanvasPattern | null {
    const ink = contrast(color) === '#ffffff' ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.3)';
    const id = `${kind}|${ink}`;
    if (this.patternCache.has(id)) return this.patternCache.get(id)!;
    const S = 10;
    const d = this.dpr;
    const c = document.createElement('canvas');
    c.width = c.height = Math.round(S * d);
    const g = c.getContext('2d')!;
    g.scale(d, d);
    g.strokeStyle = ink;
    g.fillStyle = ink;
    g.lineWidth = 1.6;
    g.beginPath();
    switch (kind) {
      case 'stripes':
        g.fillRect(0, 2, S, 2.2);
        break;
      case 'diagonal':
        g.moveTo(-1, S + 1);
        g.lineTo(S + 1, -1);
        g.moveTo(-1, 1);
        g.lineTo(1, -1);
        g.moveTo(S - 1, S + 1);
        g.lineTo(S + 1, S - 1);
        g.stroke();
        break;
      case 'dots':
        g.arc(S / 2, S / 2, 1.8, 0, Math.PI * 2);
        g.fill();
        break;
      case 'grid':
        g.fillRect(0, 0, S, 1.2);
        g.fillRect(0, 0, 1.2, S);
        break;
      case 'cross':
        g.moveTo(0, 0);
        g.lineTo(S, S);
        g.moveTo(S, 0);
        g.lineTo(0, S);
        g.stroke();
        break;
      case 'checker':
        g.fillRect(0, 0, S / 2, S / 2);
        g.fillRect(S / 2, S / 2, S / 2, S / 2);
        break;
      case 'zigzag':
        g.moveTo(0, 7);
        g.lineTo(S / 2, 3);
        g.lineTo(S, 7);
        g.stroke();
        break;
      default:
        this.patternCache.set(id, null);
        return null;
    }
    const pat = this.ctx.createPattern(c, 'repeat');
    pat?.setTransform(new DOMMatrix().scale(1 / d));
    this.patternCache.set(id, pat);
    return pat;
  }

  private draw(): void {
    const ctx = this.ctx;
    const o = this.o;
    const t = o.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (!this.layers.some((l) => l.slices.some((s) => !s.hidden))) {
      ctx.fillStyle = t.muted;
      ctx.font = `13px ${t.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(o.emptyText, this.width / 2, this.height / 2 + this.titleH / 2);
      return;
    }
    const { cx, cy, radius } = this.geometry();
    const drawn: Path2D[] = [];
    const hoverSlice = this.sliceByKey(this.hoverKey);

    for (const l of this.layers) {
      const inner = radius * l.inner;
      const outerR = radius * l.outer;
      for (const s of l.slices) {
        const key = keyOf(l.ring, s.id);
        const g = this.geom.get(key);
        if (!g || g.a1 - g.a0 <= 1e-4) continue;
        const off = this.offsets.get(key) ?? 0;
        const mid = (g.a0 + g.a1) / 2;
        const sx = cx + Math.cos(mid) * off;
        const sy = cy + Math.sin(mid) * off;
        const r1 = inner + (outerR - inner) * g.r;
        const path = this.slicePath(sx, sy, inner, r1, g.a0, g.a1, l.padAngle, l.cornerRadius);
        if (!path) continue;
        drawn.push(path);
        ctx.save();
        // hovering a name in the legend lights it up in every ring
        ctx.globalAlpha = hoverSlice && this.hoverKey !== key && !(this.legendHover && hoverSlice.id === s.id) ? o.hoverDim : 1;
        if (o.shadow) {
          ctx.shadowColor = o.shadow.color;
          ctx.shadowBlur = o.shadow.blur;
          ctx.shadowOffsetY = o.shadow.offsetY;
        }
        let fill: string | CanvasGradient = s.color;
        if (o.gradient) {
          const grad = ctx.createRadialGradient(sx, sy, Math.max(0, inner), sx, sy, r1);
          grad.addColorStop(0, shade(s.color, 0.28));
          grad.addColorStop(1, shade(s.color, -0.12));
          fill = grad;
        }
        ctx.fillStyle = fill;
        ctx.fill(path);
        const kind = s.datum.pattern ?? (o.patterns ? o.patterns[s.index % o.patterns.length] : undefined);
        if (kind && kind !== 'none') {
          const pat = this.pattern(kind, s.color);
          if (pat) {
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = pat;
            ctx.fill(path);
          }
        }
        ctx.restore();
      }
    }

    // borders between slices: painted, or cut out when the background is transparent
    if (o.borderWidth > 0) {
      ctx.save();
      ctx.lineWidth = o.borderWidth;
      ctx.lineJoin = 'round';
      if (o.cutGaps) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = '#000';
      } else ctx.strokeStyle = t.sliceBorder;
      if (o.cutGaps || t.sliceBorder !== 'transparent') for (const d of drawn) ctx.stroke(d);
      ctx.restore();
    }

    this.drawLabels(cx, cy, radius);
    if (o.center.show && o.innerRadius > 0) this.drawCenter(cx, cy, radius * o.innerRadius);
  }

  private drawLabels(cx: number, cy: number, radius: number): void {
    const ctx = this.ctx;
    const o = this.o;
    const t = o.theme;
    if (this.animStart !== 0) return;
    const outside: (LabelBox & { block: RichBlock; color: string; ex: number; L: LabelOpts })[] = [];
    for (const l of this.layers) {
      const L = l.labels;
      if (!L.show) continue;
      const inner = radius * l.inner;
      const outerR = radius * l.outer;
      for (const s of l.slices) {
        const key = keyOf(l.ring, s.id);
        const g = this.geom.get(key);
        if (!g || s.hidden || s.percent < L.minPercent) continue;
        const off = this.offsets.get(key) ?? 0;
        const mid = (g.a0 + g.a1) / 2;
        const r1 = inner + (outerR - inner) * g.r;
        const rm = inner > 0 ? (inner + r1) / 2 : r1 * 0.62;
        const inBlock = this.measureRich(this.labelRuns(s, L, false), L);
        const arcLen = (g.a1 - g.a0) * rm;
        const fits = inBlock.w < Math.min(arcLen * 0.9, (r1 - inner) * 1.6) && r1 - inner > inBlock.h * 1.15;
        const pos = L.position === 'auto' ? (fits ? 'inside' : 'outside') : L.position;
        if (pos === 'inside') {
          if (!fits && L.position === 'auto') continue;
          this.drawRich(inBlock, cx + Math.cos(mid) * (rm + off), cy + Math.sin(mid) * (rm + off), 'center', L.insideColor ?? contrast(s.color));
          continue;
        }
        const block = this.measureRich(this.labelRuns(s, L, true), L);
        const right = Math.cos(mid) >= 0;
        const ax = cx + Math.cos(mid) * (r1 + off);
        const ay = cy + Math.sin(mid) * (r1 + off);
        // elbow: the end of the radial part of the line
        const re = r1 + off + L.radialLength;
        const ex = cx + Math.cos(mid) * re;
        const ey = cy + Math.sin(mid) * re;
        const x =
          L.alignTo === 'line'
            ? cx + (right ? 1 : -1) * (outerR + o.hoverOffset + L.lineLength)
            : L.alignTo === 'none'
              ? ex + (right ? 1 : -1) * L.lineLength
              : right
                ? this.width - L.edgeDistance - block.w - 4
                : L.edgeDistance + block.w + 4;
        const y = L.alignTo === 'line' ? cy + Math.sin(mid) * (outerR + 14) : ey;
        outside.push({ index: s.index, ax, ay, x, y, right, h: block.h, block, color: s.color, ex, L });
      }
    }
    const minGap = Math.max(...outside.map((b) => b.L.fontSize), 12) + 6;
    layoutOutsideLabels(outside, minGap, this.titleH + 4, this.height - 4);
    for (const lb of outside) {
      const L = lb.L;
      if (L.showLine) {
        const elbowX = L.alignTo === 'line' ? lb.x + (lb.right ? -8 : 8) : lb.ex;
        ctx.strokeStyle = t.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lb.ax, lb.ay);
        if (L.lineSmooth) ctx.quadraticCurveTo(elbowX, lb.y, lb.x, lb.y);
        else {
          ctx.lineTo(elbowX, lb.y);
          ctx.lineTo(lb.x, lb.y);
        }
        ctx.stroke();
        ctx.fillStyle = lb.color;
        ctx.beginPath();
        ctx.arc(lb.ax, lb.ay, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      this.drawRich(lb.block, lb.x + (lb.right ? 4 : -4), lb.y, lb.right ? 'left' : 'right', L.color ?? t.text);
    }
  }

  private drawCenter(cx: number, cy: number, inner: number): void {
    if (inner < 26) return; // hole too small for text
    const ctx = this.ctx;
    const o = this.o;
    const t = o.theme;
    const hovered = o.center.followHover ? this.sliceByKey(this.hoverKey) : null;
    const total = this.total;
    const big = hovered ? o.valueFormatter(hovered.value) : typeof o.center.value === 'function' ? o.center.value(total) : (o.center.value ?? o.valueFormatter(total));
    const small = hovered ? `${hovered.label} · ${o.percentFormatter(hovered.percent)}` : o.center.title;
    // half donuts: put the text above the center line
    const half = Math.abs(o.endAngle - o.startAngle) <= 180;
    const y = half ? cy - inner * 0.3 : cy;
    const c = o.center;
    let size = Math.max(10, Math.min(34, inner * 0.36) * c.fontScale);
    ctx.font = `700 ${size}px ${t.font}`;
    while (size > 11 && ctx.measureText(big).width > inner * 1.6) {
      size -= 1;
      ctx.font = `700 ${size}px ${t.font}`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = hovered ? hovered.color : (c.valueColor ?? t.text);
    ctx.fillText(big, cx, y - size * 0.25);
    ctx.font = `${Math.max(11, size * 0.42)}px ${t.font}`;
    ctx.fillStyle = c.titleColor ?? t.muted;
    ctx.fillText(small, cx, y + size * 0.62);
  }

  // ------------------------------------------------------------------ interaction

  /** Key (ring|id) of the slice under the point. */
  private sliceAt(x: number, y: number): string | null {
    const { cx, cy, radius } = this.layoutCache;
    const start = this.o.startAngle * DEG;
    for (const l of this.layers) {
      const inner = radius * l.inner;
      const outerR = radius * l.outer;
      for (const s of l.slices) {
        const key = keyOf(l.ring, s.id);
        const g = this.geom.get(key);
        if (!g || s.hidden || g.a1 - g.a0 <= 1e-4) continue;
        const off = this.offsets.get(key) ?? 0;
        const mid = (g.a0 + g.a1) / 2;
        const dx = x - (cx + Math.cos(mid) * off);
        const dy = y - (cy + Math.sin(mid) * off);
        const d = Math.hypot(dx, dy);
        const r1 = inner + (outerR - inner) * g.r;
        if (d < inner || d > r1 + 2) continue;
        const a = normAngle(Math.atan2(dy, dx), start);
        if (a >= g.a0 && a <= g.a1) return key;
      }
    }
    return null;
  }

  /** hovering from the legend (same name lit in every ring) */
  private legendHover = false;

  private setHover(key: string | null, fromLegend = false): void {
    this.legendHover = fromLegend;
    if (this.hoverKey === key) return;
    this.hoverKey = key;
    const s = this.sliceByKey(key);
    this.legendEl.querySelectorAll<HTMLElement>('.pc-legend__item').forEach((li) => li.classList.toggle('is-hover', li.dataset.id === s?.id));
    this.emit('hover', s);
    this.kick();
  }

  private showTooltip(s: PieSlice | null, x: number, y: number): void {
    const tt = this.tooltipEl;
    if (!s || !this.o.tooltip.show) {
      tt.classList.remove('is-visible');
      return;
    }
    const o = this.o;
    const series = this.layers.length > 1 && s.ringName ? `<div class="pc-tooltip__series">${esc(s.ringName)}</div>` : '';
    tt.innerHTML = o.tooltip.formatter
      ? o.tooltip.formatter({ ...s }, this.layerTotal(s.ring))
      : `${series}<div class="pc-tooltip__head"><span class="pc-tooltip__dot" style="background:${s.color}"></span>${esc(s.label)}</div>
         ${
           o.tooltip.showValue || o.tooltip.showPercent
             ? `<div class="pc-tooltip__value">${o.tooltip.showValue ? esc(o.valueFormatter(s.value)) : ''}${
                 o.tooltip.showPercent ? `<span>${esc(o.percentFormatter(s.percent))}</span>` : ''
               }</div>`
             : ''
         }
         ${
           s.children
             ? `<div class="pc-tooltip__list">${s.children
                 .slice(0, 8)
                 .map((c) => `<div><span>${esc(c.label)}</span><b>${esc(o.valueFormatter(c.value))}</b></div>`)
                 .join('')}${s.children.length > 8 ? `<div><span>+${s.children.length - 8}</span></div>` : ''}</div>`
             : ''
         }`;
    tt.classList.add('is-visible');
    if (!o.tooltip.followCursor) {
      // anchor next to the slice, just outside its edge
      const key = keyOf(s.ring, s.id);
      const g = this.geom.get(key);
      const l = this.layers[s.ring];
      const { cx, cy, radius } = this.layoutCache;
      if (g && l) {
        const mid = (g.a0 + g.a1) / 2;
        const r = radius * (l.inner + (l.outer - l.inner) * g.r) + (this.offsets.get(key) ?? 0);
        x = cx + Math.cos(mid) * r;
        y = cy + Math.sin(mid) * r;
      }
    }
    const w = tt.offsetWidth;
    const h = tt.offsetHeight;
    let left = x + 14;
    let top = y + 14;
    if (left + w > this.width - 4) left = x - w - 14;
    if (top + h > this.height - 4) top = y - h - 14;
    tt.style.transform = `translate(${Math.max(4, left)}px, ${Math.max(4, top)}px)`;
  }

  private bind(): void {
    const local = (e: MouseEvent): { x: number; y: number } => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.canvas.addEventListener('pointermove', (e) => {
      const { x, y } = local(e);
      const key = this.sliceAt(x, y);
      const changed = key !== this.hoverKey;
      this.setHover(key);
      this.canvas.style.cursor = key ? 'pointer' : 'default';
      if (this.o.tooltip.followCursor || changed) this.showTooltip(this.sliceByKey(key), x, y);
    });
    this.canvas.addEventListener('pointerleave', () => {
      this.setHover(null);
      this.showTooltip(null, 0, 0);
    });
    this.canvas.addEventListener('click', (e) => {
      const { x, y } = local(e);
      const key = this.sliceAt(x, y);
      if (!key) return;
      this.emit('click', this.sliceByKey(key));
      if (this.o.selectable) this.selectKey(key);
    });
  }

  private renderLegend(): void {
    const o = this.o;
    const ul = this.legendEl;
    ul.innerHTML = '';
    // every name once, in order: main data first, then the rings
    const seen = new Set<string>();
    for (const l of this.layers)
      for (const s of l.slices) {
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        const key = keyOf(l.ring, s.id);
        const li = document.createElement('li');
        li.className = `pc-legend__item${s.hidden ? ' is-hidden' : ''}${o.legend.interactive ? ' is-interactive' : ''}${this.sliceByKey(this.hoverKey)?.id === s.id ? ' is-hover' : ''}`;
        li.dataset.id = s.id;
        li.innerHTML = `<span class="pc-legend__swatch" style="background:${s.color}"></span><span class="pc-legend__label">${esc(s.label)}</span>${
          o.legend.values ? `<span class="pc-legend__value">${esc(o.valueFormatter(s.value))}<small>${s.hidden ? '—' : esc(o.percentFormatter(s.percent))}</small></span>` : ''
        }`;
        li.addEventListener('mouseenter', () => !s.hidden && this.setHover(key, true));
        li.addEventListener('mouseleave', () => this.setHover(null));
        if (o.legend.interactive) li.addEventListener('click', () => this.toggle(s.id));
        ul.append(li);
      }
  }
}

export function createPieChart(container: HTMLElement, options: PieOptions = {}): PieChart {
  return new PieChart(container, options);
}
