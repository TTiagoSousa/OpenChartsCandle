import { gradientAt } from '../shared/color';
import { formatCompact } from '../shared/format';
import { buildParallelScale, parallelInRanges, parallelPieceIndex, parallelRangeValues, parallelSegmentAt, type ParallelScale, type ParallelTRange } from './scale';
import type {
  ParallelAxis,
  ParallelBrushEvent,
  ParallelBrushRange,
  ParallelEvent,
  ParallelHoverInfo,
  ParallelItem,
  ParallelOptions,
  ParallelSeries,
  ParallelTheme,
  ParallelValue,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const parallelDarkTheme: ParallelTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  axis: 'rgba(160, 164, 176, 0.75)',
  inactive: '#787b86',
  brushFill: 'rgba(41, 98, 255, 0.2)',
  brushBorder: 'rgba(91, 135, 255, 0.95)',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const parallelLightTheme: ParallelTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  axis: 'rgba(42, 46, 57, 0.55)',
  inactive: '#9598a1',
  brushFill: 'rgba(41, 98, 255, 0.14)',
  brushBorder: 'rgba(41, 98, 255, 0.85)',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const PARALLEL_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#607d8b'];

/** Default gradient of a continuous visualMap (low → high). */
const VM_COLORS = ['#2962ff', '#00bcd4', '#8bc34a', '#ffc107', '#f23645'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

interface SModel {
  key: string;
  src: ParallelSeries;
  index: number;
  color: string;
  width: number;
  opacity: number;
  smooth: number;
}

/** Lines drawn with one stroke (same color, opacity, width and curve). */
interface Batch {
  color: string;
  alpha: number;
  width: number;
  smooth: number;
  lines: number[];
}

type Drag =
  | { kind: 'brush'; dim: number; t0: number; x0: number; y0: number; moved: boolean }
  | { kind: 'move'; dim: number; t0: number; lo: number; hi: number; x0: number; y0: number; moved: boolean }
  | { kind: 'axis'; dim: number; x0: number; y0: number; moved: boolean };

/**
 * Parallel coordinates: one axis per dimension and one polyline per row of data, colored by series or by the
 * value on one dimension (visualMap). Drag along an axis to brush a range (several axes = AND), drag an axis
 * name to move it, legend, tooltip and animations. Thousands of lines: drawn in batches by color and cached.
 */
export class ParallelChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layer: HTMLCanvasElement;
  private lctx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private vmEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: ParallelOptions;
  private theme!: ParallelTheme;
  private list: ParallelSeries[] = [];
  private hiddenKeys = new Set<string>();
  private hiddenPieces = new Set<number>();
  private models: SModel[] = [];
  private axes: ParallelAxis[] = [];
  private scales: ParallelScale[] = [];
  /** dimension shown in each slot (axis reorder) */
  private order: number[] = [];
  private ranges: ParallelTRange[] = [];
  // flat lines (every row of every series)
  private D = 0;
  private N = 0;
  private T = new Float64Array(0);
  private lineModel: number[] = [];
  private lineRow: number[] = [];
  private lineName: string[] = [];
  private lineValue: ParallelValue[][] = [];
  private lineColor: string[] = [];
  private linePiece = new Int16Array(0);
  private visible = new Uint8Array(0);
  private active = new Uint8Array(0);
  private batches: Batch[] = [];
  private inactiveLines: number[] = [];
  // layout
  private pos: number[] = [];
  private c0 = 0;
  private c1 = 0;
  private nameBoxes: { x: number; y: number; w: number; h: number; text: string }[] = [];
  private tickStride: number[] = [];
  /** max width of the tick labels of each slot (they are cut to it) */
  private labelMax: number[] = [];
  private hover = -1;
  private drag: Drag | null = null;
  private dragged = false;
  private dirty = true;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animStart = 0;
  private raf = 0;
  private handlers = new Map<ParallelEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: ParallelOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('pl-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'pl-title';
    this.bodyEl = document.createElement('div');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'pl-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pl-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.layer = document.createElement('canvas');
    this.lctx = this.layer.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'pl-tooltip';
    this.vmEl = document.createElement('div');
    this.vmEl.className = 'pl-vm';
    this.legendEl = document.createElement('ul');
    this.plotEl.append(this.canvas, this.tooltipEl, this.vmEl);
    this.bodyEl.append(this.plotEl, this.legendEl);
    container.append(this.titleEl, this.bodyEl);
    this.list = (options.series ?? []).map((s) => ({ ...s }));
    for (const s of this.list) if (s.hidden) this.hiddenKeys.add(this.keyOf(s));
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ public API

  get series(): ParallelSeries[] {
    return this.list.map((s) => ({ ...s }));
  }

  /** Dimensions in the order they are shown (changes when an axis is dragged). */
  get axisOrder(): number[] {
    return [...this.order];
  }

  /** Replace every series (the brush is kept). */
  setSeries(series: ParallelSeries[], animate = true): void {
    this.list = series.map((s) => ({ ...s }));
    for (const s of this.list) if (s.hidden) this.hiddenKeys.add(this.keyOf(s));
    this.rebuild(animate);
    if (this.ranges.length) this.emitBrush();
  }

  /** Change options after creation. */
  setOptions(patch: ParallelOptions, animate = true): void {
    if (patch.series) {
      this.list = patch.series.map((s) => ({ ...s }));
      for (const s of this.list) if (s.hidden) this.hiddenKeys.add(this.keyOf(s));
    }
    if ('visualMap' in patch) this.hiddenPieces.clear();
    this.opts = { ...this.opts, ...patch };
    this.applyLook();
    this.rebuild(animate);
    if (this.ranges.length) this.emitBrush();
  }

  /** Show / hide a series. */
  toggle(id: string, hidden?: boolean): void {
    const h = hidden ?? !this.hiddenKeys.has(id);
    if (h) this.hiddenKeys.add(id);
    else this.hiddenKeys.delete(id);
    this.emit('toggle', { id, hidden: h });
    this.renderLegend();
    this.regroup();
    this.emitBrush();
    this.draw();
  }

  /** Brush ranges in axis units: `{ axis, from, to }` (value / log) or `{ axis, categories }`. Replaces the current ones. */
  setBrush(ranges: { axis: number; from?: number; to?: number; categories?: string[] }[]): void {
    this.ranges = [];
    for (const r of ranges) {
      const sc = this.scales[r.axis];
      if (!sc) continue;
      const ts = r.categories ? r.categories.map((c) => sc.toT(c)) : [sc.toT(r.from ?? sc.min), sc.toT(r.to ?? sc.max)];
      const ok = ts.filter((t) => Number.isFinite(t));
      if (!ok.length) continue;
      this.ranges.push({ dim: r.axis, lo: clamp(Math.min(...ok), 0, 1), hi: clamp(Math.max(...ok), 0, 1) });
    }
    this.regroup();
    this.emitBrush();
    this.draw();
  }

  clearBrush(): void {
    this.setBrush([]);
  }

  /** Current brush and selected rows. */
  getSelection(): ParallelBrushEvent {
    const sel = new Map<number, number[]>();
    let count = 0;
    let total = 0;
    for (let i = 0; i < this.N; i++) {
      if (!this.visible[i]) continue;
      total++;
      if (!this.active[i]) continue;
      count++;
      const m = this.lineModel[i];
      if (!sel.has(m)) sel.set(m, []);
      sel.get(m)!.push(this.lineRow[i]);
    }
    const ranges: ParallelBrushRange[] = this.ranges.map((r) => ({ axis: r.dim, name: this.axes[r.dim].name, ...parallelRangeValues(this.scales[r.dim], r.lo, r.hi) }));
    const selected = this.models
      .filter((m) => !this.hiddenKeys.has(m.key))
      .map((m) => ({ seriesIndex: m.index, name: m.src.name, indices: sel.get(m.index) ?? [] }));
    return { ranges, selected, count, total };
  }

  /** Show the dimensions in this order (a permutation of the axis indices). */
  setAxisOrder(order: number[]): void {
    if (order.length !== this.D || new Set(order).size !== this.D || order.some((d) => !(d >= 0 && d < this.D))) return;
    this.order = [...order];
    this.layout();
    this.dirty = true;
    this.draw();
  }

  on(event: 'hover', handler: (info: ParallelHoverInfo | null) => void): () => void;
  on(event: 'click', handler: (info: ParallelHoverInfo) => void): () => void;
  on(event: 'toggle', handler: (e: { id: string; hidden: boolean }) => void): () => void;
  on(event: 'brush', handler: (e: ParallelBrushEvent) => void): () => void;
  on(event: 'axisorder', handler: (order: number[]) => void): () => void;
  on(event: ParallelEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    this.measure();
    this.layout();
    this.dirty = true;
    this.draw();
  }

  screenshot(): string {
    this.draw();
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('pl-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ model

  private keyOf(s: ParallelSeries): string {
    return s.id ?? s.name;
  }

  private emit(e: ParallelEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private emitBrush(): void {
    if (this.handlers.get('brush')?.size) this.emit('brush', this.getSelection());
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? parallelLightTheme : parallelDarkTheme;
    const t: ParallelTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    this.theme = t;
    const vars: Record<string, string> = {
      '--pl-bg': t.background,
      '--pl-text': t.text,
      '--pl-muted': t.muted,
      '--pl-tt-bg': t.tooltipBg,
      '--pl-tt-text': t.tooltipText,
      '--pl-tt-border': t.tooltipBorder,
      '--pl-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
    this.dirty = true;
  }

  private rebuild(animate: boolean): void {
    const o = this.opts;
    const palette = o.colors ?? PARALLEL_COLORS;
    this.axes = o.axes ?? [];
    const D = (this.D = this.axes.length);
    if (this.order.length !== D) this.order = this.axes.map((_, d) => d);
    this.ranges = this.ranges.filter((r) => r.dim < D);
    const smoothOf = (v: boolean | number | undefined): number => (v === true ? 0.5 : typeof v === 'number' ? clamp(v, 0, 1) : 0);
    this.models = this.list.map((s, index) => ({
      key: this.keyOf(s),
      src: s,
      index,
      color: s.color ?? palette[index % palette.length],
      width: s.width ?? o.lineWidth ?? 1.2,
      opacity: s.opacity ?? o.opacity ?? 0.75,
      smooth: smoothOf(s.smooth ?? o.smooth),
    }));
    // flatten every row of every series
    this.lineModel = [];
    this.lineRow = [];
    this.lineName = [];
    this.lineValue = [];
    const own: (string | undefined)[] = [];
    this.models.forEach((m) => {
      m.src.data.forEach((row, r) => {
        const it: ParallelItem = Array.isArray(row) ? { value: row } : row;
        this.lineModel.push(m.index);
        this.lineRow.push(r);
        this.lineName.push(it.name ?? m.src.name);
        this.lineValue.push(it.value);
        own.push(it.color);
      });
    });
    const N = (this.N = this.lineModel.length);
    this.scales = this.axes.map((a, d) => buildParallelScale(a, this.lineValue.map((v) => v[d] ?? null)));
    this.T = new Float64Array(N * D);
    for (let i = 0; i < N; i++) for (let d = 0; d < D; d++) this.T[i * D + d] = this.scales[d].toT(this.lineValue[i][d]);
    // colors: own, visualMap or series
    const vm = o.visualMap;
    const vmDim = vm && vm.dimension >= 0 && vm.dimension < D ? vm.dimension : -1;
    this.linePiece = new Int16Array(N).fill(-1);
    this.lineColor = new Array(N);
    const cache = new Map<number, string>();
    const vmRange = this.vmRange();
    for (let i = 0; i < N; i++) {
      const m = this.models[this.lineModel[i]];
      let c = own[i] ?? m.color;
      if (vm && vmDim >= 0 && !own[i]) {
        const v = this.lineValue[i][vmDim];
        if (vm.pieces?.length) {
          const p = parallelPieceIndex(vm.pieces, v);
          this.linePiece[i] = p;
          if (p >= 0) c = vm.pieces[p].color;
        } else {
          const x = this.vmNumber(v);
          if (Number.isFinite(x)) {
            // quantized so that lines can be drawn in a few batches
            const q = Math.round(clamp((x - vmRange[0]) / (vmRange[1] - vmRange[0] || 1), 0, 1) * 48);
            if (!cache.has(q)) cache.set(q, gradientAt(vm.colors ?? VM_COLORS, q / 48));
            c = cache.get(q)!;
          }
        }
      }
      this.lineColor[i] = c;
    }
    this.hover = -1;
    this.regroup();
    this.renderLegend();
    this.renderVisual();
    this.layout();
    const a = o.animation ?? true;
    this.animStart = animate && a !== false && this.duration() > 0 ? performance.now() : 0;
    this.loop();
  }

  /** A value of the visualMap dimension as a number (categories: their index). */
  private vmNumber(v: ParallelValue | undefined): number {
    const vm = this.opts.visualMap!;
    const sc = this.scales[vm.dimension];
    if (sc?.type === 'category') {
      const i = sc.categories.indexOf(String(v));
      return i < 0 ? NaN : i;
    }
    return typeof v === 'number' ? v : NaN;
  }

  private vmRange(): [number, number] {
    const vm = this.opts.visualMap;
    const sc = vm ? this.scales[vm.dimension] : undefined;
    if (!vm || !sc) return [0, 1];
    return [vm.min ?? sc.min, vm.max ?? sc.max];
  }

  /** Visible / active flags and the draw batches. */
  private regroup(): void {
    const N = this.N;
    this.visible = new Uint8Array(N);
    this.active = new Uint8Array(N);
    const groups = new Map<string, Batch>();
    this.inactiveLines = [];
    for (let i = 0; i < N; i++) {
      const m = this.models[this.lineModel[i]];
      if (this.hiddenKeys.has(m.key) || (this.linePiece[i] >= 0 && this.hiddenPieces.has(this.linePiece[i]))) continue;
      this.visible[i] = 1;
      if (!parallelInRanges(this.T, i, this.D, this.ranges)) {
        this.inactiveLines.push(i);
        continue;
      }
      this.active[i] = 1;
      const key = `${this.lineColor[i]}|${m.opacity}|${m.width}|${m.smooth}`;
      let g = groups.get(key);
      if (!g) groups.set(key, (g = { color: this.lineColor[i], alpha: m.opacity, width: m.width, smooth: m.smooth, lines: [] }));
      g.lines.push(i);
    }
    this.batches = [...groups.values()];
    if (this.hover >= 0 && !this.active[this.hover]) this.hover = -1;
    this.dirty = true;
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 900) : 900;
  }

  private progress(now: number): number {
    if (!this.animStart) return 1;
    return easeOut(clamp((now - this.animStart) / (this.duration() || 1), 0, 1));
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    const now = performance.now();
    this.draw(now);
    if (this.animStart && now - this.animStart < this.duration()) this.raf = requestAnimationFrame(() => this.loop());
    else {
      this.animStart = 0;
      this.draw();
    }
  }

  // ------------------------------------------------------------------ legend & visualMap

  private legendCfg(): { show: boolean; position: string; interactive: boolean } {
    const l = this.opts.legend;
    const o = typeof l === 'object' ? l : {};
    return { show: (typeof l === 'boolean' ? l : o.show) ?? this.list.length > 1, position: o.position ?? 'bottom', interactive: o.interactive ?? true };
  }

  private renderLegend(): void {
    const L = this.legendCfg();
    this.bodyEl.className = `pl-body pl-legend-${L.position}`;
    this.legendEl.className = 'pl-legend';
    this.legendEl.style.display = L.show ? '' : 'none';
    if (!L.show) return;
    this.legendEl.innerHTML = this.models
      .map((m) => {
        const hidden = this.hiddenKeys.has(m.key);
        return `<li class="pl-legend__item${L.interactive ? ' is-interactive' : ''}${hidden ? ' is-hidden' : ''}" data-key="${esc(m.key)}"><i class="pl-legend__marker" style="--c:${m.color}"></i><span>${esc(m.src.name)}</span></li>`;
      })
      .join('');
    this.compactLegend();
  }

  /** A legend that would take too much of a small chart becomes one scrolling row. */
  private compactLegend(): void {
    const L = this.legendCfg();
    if (!L.show || (L.position !== 'top' && L.position !== 'bottom')) return;
    this.legendEl.classList.remove('is-compact');
    if (this.legendEl.offsetHeight > this.root.clientHeight * 0.25) this.legendEl.classList.add('is-compact');
  }

  private vmFmt(v: number): string {
    const vm = this.opts.visualMap!;
    return vm.format ? vm.format(v) : formatCompact(v);
  }

  private renderVisual(): void {
    const vm = this.opts.visualMap;
    const sc = vm ? this.scales[vm.dimension] : undefined;
    if (!vm || !sc || vm.show === false) {
      this.vmEl.style.display = 'none';
      this.vmEl.innerHTML = '';
      return;
    }
    this.vmEl.style.display = '';
    const title = vm.title ?? this.axes[vm.dimension].name;
    let html = `<span class="pl-vm__title">${esc(title)}</span>`;
    if (vm.pieces?.length) {
      html += vm.pieces
        .map((p, i) => {
          const label =
            p.label ??
            (p.value !== undefined
              ? String(p.value)
              : p.min !== undefined && p.max !== undefined
                ? `${this.vmFmt(p.min)} – ${this.vmFmt(p.max)}`
                : p.min !== undefined
                  ? `≥ ${this.vmFmt(p.min)}`
                  : `< ${this.vmFmt(p.max ?? 0)}`);
          return `<span class="pl-vm__piece${this.hiddenPieces.has(i) ? ' is-hidden' : ''}" data-piece="${i}"><i style="background:${p.color}"></i>${esc(label)}</span>`;
        })
        .join('');
    } else {
      const [lo, hi] = this.vmRange();
      const name = (v: number): string => (sc.type === 'category' ? (sc.categories[Math.round(v)] ?? '') : this.vmFmt(v));
      html += `<span>${esc(name(lo))}</span><span class="pl-vm__bar" style="background:linear-gradient(to right,${(vm.colors ?? VM_COLORS).join(',')})"></span><span>${esc(name(hi))}</span>`;
    }
    this.vmEl.innerHTML = html;
  }

  // ------------------------------------------------------------------ layout

  private measure(): void {
    this.compactLegend();
    const r = this.plotEl.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    for (const c of [this.canvas, this.layer]) {
      c.width = Math.round(this.width * this.dpr);
      c.height = Math.round(this.height * this.dpr);
    }
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  private nameFs(): number {
    return this.opts.axisName?.fontSize ?? 12;
  }

  private labelCfg(): { show: boolean; color?: string; fontSize: number } {
    const l = this.opts.axisLabel ?? true;
    const o = typeof l === 'object' ? l : {};
    return { show: l !== false, color: o.color, fontSize: o.fontSize ?? 11 };
  }

  private tickText(d: number, v: number | string): string {
    const a = this.axes[d];
    if (a.formatter) return a.formatter(v);
    return typeof v === 'number' ? formatCompact(v) : v;
  }

  /** Cut a text to a width with an ellipsis. */
  private fit(text: string, maxW: number): string {
    const ctx = this.ctx;
    if (ctx.measureText(text).width <= maxW) return text;
    let s = text;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    return s + '…';
  }

  private horizontal(): boolean {
    return (this.opts.layout ?? 'horizontal') === 'horizontal';
  }

  private layout(): void {
    const D = this.D;
    this.pos = [];
    this.nameBoxes = [];
    this.tickStride = [];
    this.labelMax = [];
    if (!D) return;
    const ctx = this.ctx;
    const pad = this.opts.padding ?? 12;
    const nfs = this.nameFs();
    const L = this.labelCfg();
    const vmH = this.vmEl.style.display === 'none' ? 0 : this.vmEl.offsetHeight + 6;
    const W = this.width;
    const H = this.height;
    ctx.font = this.font(nfs, 600);
    const names = this.order.map((d) => this.axes[d].name);
    const nameW = names.map((n) => ctx.measureText(n).width);
    ctx.font = this.font(L.fontSize);
    const labelW = (d: number): number => (L.show ? Math.max(0, ...this.scales[d].ticks.map((t) => ctx.measureText(this.tickText(d, t.value)).width)) : 0);
    if (this.horizontal()) {
      const top = pad + nfs + 10;
      const bottom = Math.max(top + 10, H - pad - vmH - (L.show ? L.fontSize / 2 + 2 : 0));
      const avail = W - pad * 2;
      const maxName = D > 1 ? Math.max(30, avail / (D - 1) - 8) : avail;
      // labels left of the axes, except the last one (right of it)
      const capW = avail * 0.22;
      const lw0 = L.show ? Math.min(labelW(this.order[0]), capW) : 0;
      const lwN = L.show && D > 1 ? Math.min(labelW(this.order[D - 1]), capW) : 0;
      const left = pad + Math.max(lw0 ? lw0 + 8 : 0, Math.min(nameW[0], maxName) / 2);
      const right = Math.max(left + 10, W - pad - Math.max(lwN ? lwN + 8 : 0, Math.min(nameW[D - 1], maxName) / 2));
      const step = D > 1 ? (right - left) / (D - 1) : 0;
      this.labelMax = this.order.map((_, j) => (j === 0 ? lw0 : j === D - 1 && D > 1 ? lwN : Math.max(16, step - 16)));
      this.pos = this.order.map((_, j) => (D > 1 ? left + j * step : (left + right) / 2));
      this.c0 = bottom;
      this.c1 = top;
      ctx.font = this.font(nfs, 600);
      const mw = D > 1 ? Math.max(12, step - 6) : avail;
      this.nameBoxes = names.map((n, j) => {
        const text = this.fit(n, mw);
        const w = ctx.measureText(text).width;
        return { x: this.pos[j] - w / 2, y: top - 8 - nfs, w, h: nfs + 4, text };
      });
    } else {
      const maxName = Math.max(30, W * 0.28);
      const left = pad + Math.min(Math.max(...nameW), maxName) + 12;
      const top = pad + 6;
      const bottom = Math.max(top + 10, H - pad - vmH - (L.show ? L.fontSize + 8 : 4));
      const lastW = L.show ? Math.max(...this.order.map((d) => labelW(d))) / 2 : 0;
      const right = Math.max(left + 10, W - pad - lastW);
      this.pos = this.order.map((_, j) => (D > 1 ? top + (j * (bottom - top)) / (D - 1) : (top + bottom) / 2));
      this.labelMax = this.order.map(() => Infinity);
      this.c0 = left;
      this.c1 = right;
      ctx.font = this.font(nfs, 600);
      this.nameBoxes = names.map((n, j) => {
        const text = this.fit(n, left - pad - 12);
        const w = ctx.measureText(text).width;
        return { x: left - 12 - w, y: this.pos[j] - nfs / 2 - 2, w, h: nfs + 4, text };
      });
    }
    // fewer tick labels on short axes
    ctx.font = this.font(L.fontSize);
    const len = Math.abs(this.c1 - this.c0);
    this.tickStride = this.order.map((d) => {
      const ticks = this.scales[d].ticks;
      if (ticks.length < 2) return 1;
      const gap = Math.abs(ticks[1].t - ticks[0].t) * len;
      const need = this.horizontal() ? L.fontSize + 6 : labelW(d) + 10;
      return Math.max(1, Math.ceil(need / Math.max(gap, 1e-6)));
    });
  }

  private cross(t: number): number {
    return this.c0 + (this.c1 - this.c0) * t;
  }

  private pt(main: number, cross: number): [number, number] {
    return this.horizontal() ? [main, cross] : [cross, main];
  }

  // ------------------------------------------------------------------ drawing

  /** Add the path of one line to the current path. */
  private trace(ctx: CanvasRenderingContext2D, i: number, smooth: number): void {
    const D = this.D;
    let pen = false;
    let pm = 0;
    let pc = 0;
    for (let j = 0; j < D; j++) {
      const t = this.T[i * D + this.order[j]];
      if (!Number.isFinite(t)) {
        pen = false;
        continue;
      }
      const m = this.pos[j];
      const c = this.cross(t);
      const [x, y] = this.pt(m, c);
      if (!pen) ctx.moveTo(x, y);
      else if (smooth) {
        const dm = (m - pm) * smooth;
        const [ax, ay] = this.pt(pm + dm, pc);
        const [bx, by] = this.pt(m - dm, c);
        ctx.bezierCurveTo(ax, ay, bx, by, x, y);
      } else ctx.lineTo(x, y);
      pen = true;
      pm = m;
      pc = c;
    }
  }

  private paintLines(ctx: CanvasRenderingContext2D): void {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const ina = this.opts.inactive ?? {};
    if (this.inactiveLines.length) {
      ctx.globalAlpha = ina.opacity ?? 0.12;
      ctx.strokeStyle = ina.color ?? this.theme.inactive;
      ctx.lineWidth = 1;
      // one stroke per chunk keeps very long paths fast
      for (let k = 0; k < this.inactiveLines.length; k += 500) {
        ctx.beginPath();
        for (const i of this.inactiveLines.slice(k, k + 500)) this.trace(ctx, i, this.models[this.lineModel[i]].smooth);
        ctx.stroke();
      }
    }
    for (const b of this.batches) {
      ctx.globalAlpha = b.alpha;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width;
      for (let k = 0; k < b.lines.length; k += 500) {
        ctx.beginPath();
        for (const i of b.lines.slice(k, k + 500)) this.trace(ctx, i, b.smooth);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private renderLayer(): void {
    const ctx = this.lctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.layer.width, this.layer.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.paintLines(ctx);
    this.dirty = false;
  }

  private draw(now = performance.now()): void {
    const ctx = this.ctx;
    const t = this.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (!this.D) return;
    const p = this.progress(now);
    if (p < 1) {
      // lines draw in from the first axis
      const a = this.pos[0];
      const b = this.pos[this.D - 1];
      const m = a - 2 + (b - a + 4) * p;
      ctx.save();
      ctx.beginPath();
      if (this.horizontal()) ctx.rect(0, 0, m, this.height);
      else ctx.rect(0, 0, this.width, m);
      ctx.clip();
      this.paintLines(ctx);
      ctx.restore();
      this.dirty = true;
    } else {
      if (this.dirty) this.renderLayer();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.layer, 0, 0);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    this.drawBrushes();
    this.drawAxes();
    if (this.hover >= 0 && p >= 1) this.drawHover(this.hover);
  }

  private brushOn(): boolean {
    return this.opts.brush !== false;
  }

  private drawBrushes(): void {
    if (!this.ranges.length) return;
    const ctx = this.ctx;
    const b = typeof this.opts.brush === 'object' ? this.opts.brush : {};
    ctx.fillStyle = b.fill ?? this.theme.brushFill;
    ctx.strokeStyle = b.border ?? this.theme.brushBorder;
    ctx.lineWidth = 1;
    for (const r of this.ranges) {
      const j = this.order.indexOf(r.dim);
      if (j < 0) continue;
      const a = this.cross(r.lo);
      const c = this.cross(r.hi);
      const lo = Math.min(a, c) - 1;
      const len = Math.max(2, Math.abs(c - a) + 2);
      const [x, y, w, h] = this.horizontal() ? [this.pos[j] - 9, lo, 18, len] : [lo, this.pos[j] - 9, len, 18];
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y + 0.5, w, h, 3);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawAxes(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const L = this.labelCfg();
    const nfs = this.nameFs();
    const hz = this.horizontal();
    const halo = t.background !== 'transparent';
    this.order.forEach((d, j) => {
      const a = this.axes[d];
      const sc = this.scales[d];
      const m = this.pos[j];
      const col = a.color ?? t.axis;
      // axis line
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const [x0, y0] = this.pt(Math.round(m) + 0.5, this.c0);
      const [x1, y1] = this.pt(Math.round(m) + 0.5, this.c1);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      // ticks and labels
      const stride = this.tickStride[j] ?? 1;
      ctx.font = this.font(L.fontSize);
      ctx.lineJoin = 'round';
      sc.ticks.forEach((tk, k) => {
        if (k % stride) return;
        const c = Math.round(this.cross(tk.t)) + 0.5;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (hz) {
          const right = j === this.D - 1 && this.D > 1;
          ctx.moveTo(right ? m + 4 : m - 4, c);
          ctx.lineTo(m, c);
        } else {
          ctx.moveTo(c, m);
          ctx.lineTo(c, m + 4);
        }
        ctx.stroke();
        if (!L.show) return;
        const text = this.fit(this.tickText(d, tk.value), this.labelMax[j] ?? Infinity);
        const onRight = hz && j === this.D - 1 && this.D > 1;
        ctx.textAlign = hz ? (onRight ? 'left' : 'right') : 'center';
        ctx.textBaseline = hz ? 'middle' : 'top';
        const [tx, ty] = hz ? [onRight ? m + 7 : m - 7, c] : [c, m + 6];
        if (halo) {
          ctx.strokeStyle = t.background;
          ctx.lineWidth = 3;
          ctx.strokeText(text, tx, ty);
        }
        ctx.fillStyle = L.color ?? t.muted;
        ctx.fillText(text, tx, ty);
      });
      // name
      const box = this.nameBoxes[j];
      if (!box) return;
      const dragging = this.drag?.kind === 'axis' && this.drag.dim === d;
      if (dragging) {
        ctx.fillStyle = t.brushFill;
        ctx.beginPath();
        ctx.roundRect(box.x - 4, box.y - 1, box.w + 8, box.h + 2, 4);
        ctx.fill();
      }
      ctx.font = this.font(nfs, 600);
      ctx.fillStyle = a.color ?? this.opts.axisName?.color ?? t.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(box.text, box.x, box.y + box.h / 2 + 0.5);
    });
  }

  private drawHover(i: number): void {
    const ctx = this.ctx;
    const m = this.models[this.lineModel[i]];
    ctx.globalAlpha = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (this.theme.background !== 'transparent') {
      ctx.strokeStyle = this.theme.background;
      ctx.lineWidth = m.width + 4;
      ctx.beginPath();
      this.trace(ctx, i, m.smooth);
      ctx.stroke();
    }
    ctx.strokeStyle = this.lineColor[i];
    ctx.lineWidth = m.width + 1.6;
    ctx.beginPath();
    this.trace(ctx, i, m.smooth);
    ctx.stroke();
    ctx.fillStyle = this.lineColor[i];
    for (let j = 0; j < this.D; j++) {
      const t = this.T[i * this.D + this.order[j]];
      if (!Number.isFinite(t)) continue;
      const [x, y] = this.pt(this.pos[j], this.cross(t));
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ------------------------------------------------------------------ interaction

  private info(i: number): ParallelHoverInfo {
    const m = this.models[this.lineModel[i]];
    return { series: m.src, seriesIndex: m.index, index: this.lineRow[i], name: this.lineName[i], value: this.lineValue[i], color: this.lineColor[i], axes: this.axes };
  }

  /** Nearest active line to the mouse, between the two axes around it. */
  private hitTest(x: number, y: number): number {
    const D = this.D;
    if (D < 2) return -1;
    const hz = this.horizontal();
    const mm = hz ? x : y;
    const mc = hz ? y : x;
    let j = -1;
    for (let k = 0; k < D - 1; k++) if (mm >= this.pos[k] && mm <= this.pos[k + 1]) j = k;
    if (j < 0) return -1;
    const span = this.pos[j + 1] - this.pos[j] || 1;
    const u = (mm - this.pos[j]) / span;
    const da = this.order[j];
    const db = this.order[j + 1];
    const len = this.c1 - this.c0;
    let best = -1;
    let bestD = 6;
    for (let i = 0; i < this.N; i++) {
      if (!this.active[i]) continue;
      const ta = this.T[i * D + da];
      const tb = this.T[i * D + db];
      if (!Number.isFinite(ta) || !Number.isFinite(tb)) continue;
      const sm = this.models[this.lineModel[i]].smooth;
      const c = this.c0 + len * parallelSegmentAt(ta, tb, u, sm);
      const slope = ((tb - ta) * len) / span;
      const dist = Math.abs(c - mc) / Math.sqrt(1 + (sm ? 0 : slope * slope));
      if (dist < bestD) {
        bestD = dist;
        best = i;
      }
    }
    return best;
  }

  /** Slot of the axis whose brush area is under the point, or -1. */
  private axisAt(x: number, y: number): number {
    const hz = this.horizontal();
    const mm = hz ? x : y;
    const mc = hz ? y : x;
    const lo = Math.min(this.c0, this.c1) - 8;
    const hi = Math.max(this.c0, this.c1) + 8;
    if (mc < lo || mc > hi) return -1;
    let best = -1;
    let bd = 13;
    this.pos.forEach((p, j) => {
      const dd = Math.abs(p - mm);
      if (dd < bd) {
        bd = dd;
        best = j;
      }
    });
    return best;
  }

  private nameAt(x: number, y: number): number {
    return this.nameBoxes.findIndex((b) => x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 4 && y <= b.y + b.h + 4);
  }

  private tAt(x: number, y: number): number {
    const c = this.horizontal() ? y : x;
    return clamp((c - this.c0) / (this.c1 - this.c0 || 1), 0, 1);
  }

  private setRange(dim: number, lo: number, hi: number | null): void {
    this.ranges = this.ranges.filter((r) => r.dim !== dim);
    if (hi !== null) this.ranges.push({ dim, lo: Math.min(lo, hi), hi: Math.max(lo, hi) });
    this.regroup();
    this.emitBrush();
    this.draw();
  }

  private bind(): void {
    const pos = (e: MouseEvent): { x: number; y: number } => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !this.D) return;
      const { x, y } = pos(e);
      const n = this.opts.axisReorder !== false && this.D > 1 ? this.nameAt(x, y) : -1;
      if (n >= 0) this.drag = { kind: 'axis', dim: this.order[n], x0: x, y0: y, moved: false };
      else if (this.brushOn()) {
        const j = this.axisAt(x, y);
        if (j < 0) return;
        const dim = this.order[j];
        const t = this.tAt(x, y);
        const r = this.ranges.find((q) => q.dim === dim);
        if (r && t >= r.lo && t <= r.hi) this.drag = { kind: 'move', dim, t0: t, lo: r.lo, hi: r.hi, x0: x, y0: y, moved: false };
        else this.drag = { kind: 'brush', dim, t0: t, x0: x, y0: y, moved: false };
      } else return;
      this.canvas.setPointerCapture(e.pointerId);
      this.setHover(-1);
      this.tooltipEl.classList.remove('is-visible');
      e.preventDefault();
    });
    this.canvas.addEventListener('pointermove', (e) => {
      const { x, y } = pos(e);
      const g = this.drag;
      if (g) {
        if (!g.moved && Math.hypot(x - g.x0, y - g.y0) < 3) return;
        g.moved = true;
        if (g.kind === 'brush') this.setRange(g.dim, g.t0, this.tAt(x, y));
        else if (g.kind === 'move') {
          const w = g.hi - g.lo;
          const lo = clamp(g.lo + this.tAt(x, y) - g.t0, 0, 1 - w);
          this.setRange(g.dim, lo, lo + w);
        } else {
          const mm = this.horizontal() ? x : y;
          let slot = 0;
          let bd = Infinity;
          this.pos.forEach((p, j) => {
            if (Math.abs(p - mm) < bd) {
              bd = Math.abs(p - mm);
              slot = j;
            }
          });
          const cur = this.order.indexOf(g.dim);
          if (slot !== cur) {
            this.order.splice(cur, 1);
            this.order.splice(slot, 0, g.dim);
            this.layout();
            this.dirty = true;
          }
          this.draw();
        }
        return;
      }
      const h = this.hitTest(x, y);
      this.setHover(h);
      const onName = this.opts.axisReorder !== false && this.D > 1 && this.nameAt(x, y) >= 0;
      this.canvas.style.cursor = onName ? 'grab' : h >= 0 ? 'pointer' : this.brushOn() && this.axisAt(x, y) >= 0 ? 'crosshair' : '';
      this.showTooltip(e);
    });
    const end = (e: PointerEvent): void => {
      const g = this.drag;
      if (!g) return;
      this.drag = null;
      this.dragged = g.moved || g.kind !== 'axis';
      if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
      // a click on an axis clears its brush
      if (!g.moved && g.kind !== 'axis') this.setRange(g.dim, 0, null);
      if (g.kind === 'axis') {
        if (g.moved) this.emit('axisorder', [...this.order]);
        this.draw();
      }
    };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
    this.canvas.addEventListener('pointerleave', () => {
      if (this.drag) return;
      this.setHover(-1);
      this.tooltipEl.classList.remove('is-visible');
    });
    this.canvas.addEventListener('click', (e) => {
      const { x, y } = pos(e);
      if (this.dragged) {
        this.dragged = false;
        return;
      }
      const h = this.hitTest(x, y);
      if (h >= 0) this.emit('click', this.info(h));
    });
    this.legendEl.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.pl-legend__item');
      if (!li || !this.legendCfg().interactive) return;
      this.toggle(li.dataset.key!);
    });
    this.vmEl.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('.pl-vm__piece');
      if (!el) return;
      const i = Number(el.dataset.piece);
      if (this.hiddenPieces.has(i)) this.hiddenPieces.delete(i);
      else this.hiddenPieces.add(i);
      el.classList.toggle('is-hidden', this.hiddenPieces.has(i));
      this.regroup();
      this.emitBrush();
      this.draw();
    });
  }

  private setHover(h: number): void {
    if (h === this.hover) return;
    this.hover = h;
    this.emit('hover', h >= 0 ? this.info(h) : null);
    this.draw();
  }

  private fmtValue(v: ParallelValue | undefined, axis: ParallelAxis): string {
    if (v === null || v === undefined) return '–';
    if (this.opts.valueFormatter) return this.opts.valueFormatter(v, axis);
    return typeof v === 'number' ? v.toLocaleString('pt-PT', { maximumFractionDigits: 2 }) : v;
  }

  private showTooltip(e: PointerEvent): void {
    const tt = this.opts.tooltip ?? true;
    const el = this.tooltipEl;
    const h = this.hover;
    if (h < 0 || tt === false || (typeof tt === 'object' && tt.show === false)) {
      el.classList.remove('is-visible');
      return;
    }
    const info = this.info(h);
    if (typeof tt === 'object' && tt.formatter) el.innerHTML = tt.formatter(info);
    else {
      const sub = info.name !== info.series.name ? `<div class="pl-tooltip__sub">${esc(info.series.name)}</div>` : '';
      el.innerHTML =
        `<div class="pl-tooltip__head"><i class="pl-tooltip__dot" style="background:${info.color}"></i>${esc(info.name)}</div>${sub}` +
        this.order.map((d) => `<div class="pl-tooltip__row"><span>${esc(this.axes[d].name)}</span><b>${esc(this.fmtValue(info.value[d], this.axes[d]))}</b></div>`).join('');
    }
    el.classList.add('is-visible');
    const r = this.plotEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const w = el.offsetWidth;
    const hh = el.offsetHeight;
    const left = x + 16 + w > this.width ? x - 16 - w : x + 16;
    const top = clamp(y + 16 + hh > this.height ? y - 16 - hh : y + 16, 0, Math.max(0, this.height - hh));
    el.style.transform = `translate(${Math.max(0, left)}px, ${top}px)`;
  }
}

export function createParallelChart(container: HTMLElement, options: ParallelOptions = {}): ParallelChart {
  return new ParallelChart(container, options);
}
