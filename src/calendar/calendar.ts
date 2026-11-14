import { gradientAt } from '../shared/color';
import { formatCompact } from '../shared/format';
import { buildGrid, dayKey, monthEdges, parseDay, type Grid, type GridDay } from './layout';
import type {
  CalendarCell,
  CalendarDate,
  CalendarDatum,
  CalendarEvent,
  CalendarGraphicApi,
  CalendarLabelOptions,
  CalendarOptions,
  CalendarTheme,
  CalendarVisualMap,
} from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const calendarDarkTheme: CalendarTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  cell: 'rgba(42, 46, 57, 0.55)',
  cellBorder: '#131722',
  splitLine: 'rgba(209, 212, 220, 0.5)',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const calendarLightTheme: CalendarTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  cell: '#f0f3fa',
  cellBorder: '#ffffff',
  splitLine: '#9598a1',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

/** Default colors of the visualMap (low → high). */
export const CALENDAR_COLORS = ['#1e3a5f', '#2962ff', '#ff9800', '#f23645'];

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const TAU = Math.PI * 2;

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const opt = <T extends object>(v: boolean | T | undefined, dflt: boolean): (T & { show: boolean }) => {
  if (typeof v === 'object') return { ...v, show: (v as { show?: boolean }).show ?? true };
  return { show: v ?? dflt } as T & { show: boolean };
};

interface NameLabel {
  show: boolean;
  names?: string[];
  color?: string;
}

interface Cell extends CalendarCell {
  /** entry order 0–1 */
  order: number;
  /** grid day */
  g: GridDay;
}

/**
 * Calendar chart: one or more years, months or day ranges as a grid of days (a column per week like
 * GitHub, or a row per week like a wall calendar), with a value per day as a heatmap or circles,
 * a visualMap legend, month outlines, labels, your own drawing per cell and a tooltip.
 */
export class CalendarChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private vmEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: CalendarOptions;
  private theme!: CalendarTheme;
  private data = new Map<string, CalendarDatum>();
  private grids: Grid[] = [];
  private list: Cell[] = [];
  private byKey = new Map<string, Cell>();
  private vmin = 0;
  private vmax = 1;
  private off = new Set<number>();
  private top: Set<string> = new Set();
  private hover: Cell | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animStart = 0;
  private raf = 0;
  private handlers = new Map<CalendarEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: CalendarOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('cc-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'cc-title';
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'cc-body';
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'cc-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cc-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'cc-tooltip';
    this.vmEl = document.createElement('div');
    this.vmEl.className = 'cc-vm';
    this.plotEl.append(this.canvas, this.tooltipEl);
    this.bodyEl.append(this.plotEl, this.vmEl);
    container.append(this.titleEl, this.bodyEl);
    this.setDataInternal(options.data ?? []);
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.plotEl);
    this.measure();
    this.rebuild(true);
  }

  // ------------------------------------------------------------------ public API

  /** Every cell shown, in date order. */
  get cells(): CalendarCell[] {
    return this.list.map(({ order: _o, g: _g, ...c }) => ({ ...c }));
  }

  /** Replace the day data. */
  setData(data: CalendarOptions['data'], animate = false): void {
    this.opts.data = data;
    this.setDataInternal(data ?? []);
    this.rebuild(animate);
  }

  /** Change options after creation. */
  setOptions(patch: CalendarOptions, animate = false): void {
    if (patch.data) this.setDataInternal(patch.data);
    if (patch.visualMap !== undefined) this.off.clear();
    this.opts = { ...this.opts, ...patch };
    this.applyLook();
    this.rebuild(animate);
  }

  /** The cell of a day (box in px relative to the chart), or null when it is not shown. */
  cellAt(date: CalendarDate): CalendarCell | null {
    const d = parseDay(date);
    return (d && this.byKey.get(dayKey(d))) || null;
  }

  /** Color of a value on the visualMap. */
  colorOf(v: number): string {
    const vm = this.vm();
    if (vm.pieces) {
      const i = this.pieceOf(vm, v);
      return i < 0 ? this.cellColor() : vm.pieces[i].color;
    }
    return gradientAt(vm.colors ?? CALENDAR_COLORS, (v - this.vmin) / (this.vmax - this.vmin || 1));
  }

  on(event: 'click', handler: (cell: CalendarCell) => void): () => void;
  on(event: 'hover', handler: (cell: CalendarCell | null) => void): () => void;
  on(event: CalendarEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  resize(): void {
    this.measure();
    this.layout();
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
    this.root.classList.remove('cc-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ model

  private setDataInternal(data: NonNullable<CalendarOptions['data']>): void {
    this.data.clear();
    for (const raw of data) {
      const d: CalendarDatum = Array.isArray(raw) ? { date: raw[0], value: raw[1] } : raw;
      const day = parseDay(d.date);
      if (day) this.data.set(dayKey(day), d);
    }
  }

  private emit(e: CalendarEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? calendarLightTheme : calendarDarkTheme;
    const t: CalendarTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    if (t.background === 'transparent' && o.theme !== 'light' && typeof o.theme !== 'object') t.cellBorder = 'rgba(0,0,0,0)';
    this.theme = t;
    const vars: Record<string, string> = {
      '--cc-bg': t.background,
      '--cc-text': t.text,
      '--cc-muted': t.muted,
      '--cc-tt-bg': t.tooltipBg,
      '--cc-tt-text': t.tooltipText,
      '--cc-tt-border': t.tooltipBorder,
      '--cc-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
  }

  private vm(): CalendarVisualMap {
    return this.opts.visualMap || {};
  }

  private hasVisual(): boolean {
    return this.opts.visualMap !== false && (this.opts.type ?? 'heatmap') !== 'none';
  }

  private pieceOf(vm: CalendarVisualMap, v: number): number {
    return (vm.pieces ?? []).findIndex((p) => (p.value !== undefined ? v === p.value : (p.min === undefined || v >= p.min) && (p.max === undefined || v < p.max || (v === p.max && p.max === this.vmax))));
  }

  private cellColor(): string {
    return this.opts.cell?.color ?? this.theme.cell;
  }

  private rebuild(animate: boolean): void {
    const o = this.opts;
    const orient = o.orient ?? 'horizontal';
    const ranges = o.range === undefined ? [new Date().getFullYear()] : Array.isArray(o.range) && !(o.range.length === 2 && isDayPair(o.range)) ? o.range : [o.range];
    this.grids = (ranges as Parameters<typeof buildGrid>[0][]).map((r, i) => buildGrid(r, i, orient, o.firstDay ?? 1));
    // value range of the shown days
    let lo = Infinity;
    let hi = -Infinity;
    for (const g of this.grids)
      for (const d of g.days) {
        const v = this.data.get(d.key)?.value;
        if (typeof v === 'number' && isFinite(v)) {
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      }
    const vm = this.vm();
    this.vmin = vm.min ?? (lo === Infinity ? 0 : lo);
    this.vmax = vm.max ?? (hi === -Infinity ? 1 : hi);
    // biggest values for the ripple effect
    this.top = new Set();
    if (o.effect && (o.type ?? 'heatmap') === 'scatter') {
      const all = this.grids.flatMap((g) => g.days).filter((d) => typeof this.data.get(d.key)?.value === 'number');
      all.sort((a, b) => (this.data.get(b.key)!.value as number) - (this.data.get(a.key)!.value as number));
      for (const d of all.slice(0, o.effect.top)) this.top.add(d.key);
    }
    this.renderVisual();
    this.layout();
    const a = o.animation ?? true;
    this.animStart = animate && a !== false ? performance.now() : 0;
    this.loop();
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 800) : 800;
  }

  private progress(now: number): number {
    if (!this.animStart) return 1;
    return clamp((now - this.animStart) / (this.duration() || 1), 0, 1);
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    if (this.destroyed) return;
    const now = performance.now();
    this.draw(now);
    if (this.progress(now) < 1 || this.top.size || this.opts.animate) this.raf = requestAnimationFrame(() => this.loop());
    else this.animStart = 0;
  }

  // ------------------------------------------------------------------ layout

  private measure(): void {
    const r = this.plotEl.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  private labels(): { day: NameLabel; month: NameLabel; year: { show: boolean; color?: string } } {
    const o = this.opts;
    return {
      day: opt<Omit<NameLabel, 'show'>>(o.dayLabel, true),
      month: opt<Omit<NameLabel, 'show'>>(o.monthLabel, true),
      year: opt<{ color?: string }>(o.yearLabel, this.grids.length > 1),
    };
  }

  /** Place every calendar and its cells in px. */
  private layout(): void {
    const o = this.opts;
    const horizontal = (o.orient ?? 'horizontal') === 'horizontal';
    const pad = o.padding ?? 10;
    const gap = o.gap ?? 28;
    const L = this.labels();
    const n = this.grids.length || 1;
    // room for the labels: weekdays on the side (horizontal) or on top (vertical), months the other way
    const side = (horizontal ? (L.day.show ? 30 : 0) : L.month.show ? 34 : 0) + (horizontal && L.year.show ? 24 : 0);
    const head = (horizontal ? (L.month.show ? 18 : 0) : L.day.show ? 20 : 0) + (!horizontal && L.year.show ? 22 : 0);
    const maxCols = Math.max(1, ...this.grids.map((g) => g.cols));
    const maxRows = Math.max(1, ...this.grids.map((g) => g.rows));
    const W = this.width - pad * 2;
    const H = this.height - pad * 2;
    let cw: number;
    let ch: number;
    const cs = o.cellSize ?? 'auto';
    if (cs === 'auto') {
      // horizontal: calendars stacked; vertical: side by side
      const cw0 = horizontal ? (W - side) / maxCols : (W - n * side - (n - 1) * gap) / (7 * n);
      const ch0 = horizontal ? (H - n * head - (n - 1) * gap) / (7 * n) : (H - head) / maxRows;
      // fill the space without very tall or very flat cells
      cw = Math.max(2, Math.min(cw0, ch0 * 2.2));
      ch = Math.max(2, Math.min(ch0, cw0 * 1.15));
    } else if (typeof cs === 'number') cw = ch = cs;
    else [cw, ch] = cs;
    const blockW = horizontal ? side + maxCols * cw : n * (side + 7 * cw) + (n - 1) * gap;
    const blockH = horizontal ? n * (head + 7 * ch) + (n - 1) * gap : head + maxRows * ch;
    const x0 = pad + Math.max(0, (W - blockW) / 2);
    const y0 = pad + Math.max(0, (H - blockH) / 2);
    this.list = [];
    this.byKey.clear();
    let total = 0;
    for (const g of this.grids) total += g.days.length;
    let k = 0;
    this.origins = [];
    for (const g of this.grids) {
      const gx = horizontal ? x0 + side : x0 + g.index * (side + 7 * cw + gap) + side;
      const gy = horizontal ? y0 + g.index * (head + 7 * ch + gap) + head : y0 + head;
      this.origins.push({ x: gx, y: gy, cw, ch });
      for (const d of g.days) {
        const datum = this.data.get(d.key) ?? null;
        const v = datum?.value;
        const value = typeof v === 'number' && isFinite(v) ? v : null;
        const c: Cell = {
          key: d.key,
          date: d.date,
          weekday: d.weekday,
          week: d.week,
          calendar: g.index,
          value,
          datum,
          color: '',
          x: gx + d.col * cw,
          y: gy + d.row * ch,
          w: cw,
          h: ch,
          order: total > 1 ? k / (total - 1) : 0,
          g: d,
        };
        c.color = this.fill(c);
        k++;
        this.list.push(c);
        this.byKey.set(d.key, c);
      }
    }
  }

  private origins: { x: number; y: number; cw: number; ch: number }[] = [];

  /** Fill color of a cell: datum.color, the visualMap, or the empty color. */
  private fill(c: Cell): string {
    if (c.datum?.color) return c.datum.color;
    if (c.value === null || !this.hasVisual()) return this.cellColor();
    const vm = this.vm();
    if (vm.pieces) {
      const i = this.pieceOf(vm, c.value);
      if (i < 0 || this.off.has(i)) return this.cellColor();
      return vm.pieces[i].color;
    }
    return this.colorOf(c.value);
  }

  /** Circle color ('scatter'): the day's own, the visualMap's, or `color`. */
  private symbolColor(c: Cell): string {
    return c.datum?.color ?? (this.opts.visualMap && c.value !== null ? this.colorOf(c.value) : (this.opts.color ?? '#2962ff'));
  }

  /** A value hidden by the legend (a piece switched off). */
  private filtered(c: Cell): boolean {
    const vm = this.vm();
    if (!vm.pieces || c.value === null) return false;
    const i = this.pieceOf(vm, c.value);
    return i < 0 || this.off.has(i);
  }

  // ------------------------------------------------------------------ visualMap legend

  private renderVisual(): void {
    const vm = this.vm();
    const el = this.vmEl;
    const show = this.hasVisual() && vm.show !== false && this.opts.visualMap !== undefined && (this.vmax > this.vmin || !!vm.pieces);
    el.style.display = show ? '' : 'none';
    const pos = vm.position ?? 'bottom';
    this.bodyEl.className = `cc-body cc-vm-${pos}`;
    if (!show) {
      el.innerHTML = '';
      return;
    }
    const fmt = vm.format ?? ((v: number) => formatCompact(v));
    const title = vm.title ? `<span class="cc-vm__title">${esc(vm.title)}</span>` : '';
    if (vm.pieces) {
      el.innerHTML =
        title +
        vm.pieces
          .map((p, i) => {
            const label = p.label ?? (p.value !== undefined ? fmt(p.value) : p.min === undefined ? `< ${fmt(p.max!)}` : p.max === undefined ? `≥ ${fmt(p.min)}` : `${fmt(p.min)} – ${fmt(p.max)}`);
            return `<button type="button" class="cc-vm__piece${this.off.has(i) ? ' is-off' : ''}" data-i="${i}"><i style="background:${p.color}"></i>${esc(label)}</button>`;
          })
          .join('');
      return;
    }
    const colors = vm.colors ?? CALENDAR_COLORS;
    const vert = pos === 'right';
    el.innerHTML = `${title}<span class="cc-vm__end">${esc(fmt(vert ? this.vmax : this.vmin))}</span><span class="cc-vm__bar" style="background:linear-gradient(${vert ? 'to bottom' : 'to right'},${(vert ? [...colors].reverse() : colors).join(',')})"></span><span class="cc-vm__end">${esc(fmt(vert ? this.vmin : this.vmax))}</span>`;
  }

  // ------------------------------------------------------------------ drawing

  private api(now: number): CalendarGraphicApi {
    return {
      width: this.width,
      height: this.height,
      theme: this.theme,
      cell: (d) => this.cellAt(d),
      cells: this.list,
      colorOf: (v) => this.colorOf(v),
      progress: easeOut(this.progress(now)),
      time: now,
    };
  }

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  private draw(now = performance.now()): void {
    const ctx = this.ctx;
    const t = this.theme;
    const o = this.opts;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    const p = this.progress(now);
    const api = this.api(now);
    const type = o.type ?? 'heatmap';
    const cellOpt = o.cell ?? {};
    const gapPx = cellOpt.gap ?? 0;
    const radius = cellOpt.radius ?? 0;
    const bw = cellOpt.borderWidth ?? 1;
    const border = cellOpt.borderColor ?? t.cellBorder;
    const [s0, s1] = o.symbolSize ?? [0.15, 0.95];
    const appear = (c: Cell): number => (p >= 1 ? 1 : easeOut(clamp(p * 1.6 - c.order * 0.6, 0, 1)));

    // cells
    for (const c of this.list) {
      const a = appear(c);
      const x = c.x + gapPx / 2;
      const y = c.y + gapPx / 2;
      const w = c.w - gapPx;
      const h = c.h - gapPx;
      // empty cell under the value, so the value fades in over it
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.cellColor();
      this.rect(x, y, w, h, radius);
      ctx.fill();
      // the value's color (heatmap), or a day's own color with any type except circles
      if ((type === 'heatmap' || (type === 'none' && c.datum?.color)) && c.color !== this.cellColor()) {
        ctx.globalAlpha = a;
        ctx.fillStyle = c.color;
        this.rect(x, y, w, h, radius);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (bw > 0) {
        ctx.strokeStyle = border;
        ctx.lineWidth = bw;
        this.rect(x, y, w, h, radius);
        ctx.stroke();
      }
    }

    // circles
    if (type === 'scatter') {
      const span = this.vmax - this.vmin || 1;
      for (const c of this.list) {
        if (c.value === null || this.filtered(c)) continue;
        const tv = clamp((c.value - this.vmin) / span, 0, 1);
        const r = (Math.min(c.w, c.h) / 2) * (s0 + (s1 - s0) * tv) * appear(c);
        if (r <= 0) continue;
        const color = this.symbolColor(c);
        const cx = c.x + c.w / 2;
        const cy = c.y + c.h / 2;
        if (this.top.has(c.key)) this.ripple(cx, cy, r, o.effect?.color ?? color, now);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.fill();
      }
    }

    // own drawing per cell
    if (o.renderCell) {
      for (const c of this.list) {
        ctx.save();
        ctx.globalAlpha = appear(c);
        o.renderCell(ctx, c, api);
        ctx.restore();
      }
    }

    this.drawLabels();
    this.drawSplit();
    this.drawAxisLabels();

    // hovered day
    if (this.hover) {
      const c = this.hover;
      ctx.strokeStyle = t.text;
      ctx.lineWidth = 2;
      this.rect(c.x + gapPx / 2 + 1, c.y + gapPx / 2 + 1, c.w - gapPx - 2, c.h - gapPx - 2, radius);
      ctx.stroke();
    }

    if (o.graphic) {
      ctx.save();
      o.graphic(ctx, api);
      ctx.restore();
    }
  }

  private rect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    if (r > 0) ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.min(r, w / 2, h / 2));
    else ctx.rect(x, y, Math.max(0, w), Math.max(0, h));
  }

  private ripple(x: number, y: number, r: number, color: string, now: number): void {
    const ctx = this.ctx;
    for (let i = 0; i < 3; i++) {
      const t = ((now / 1600 + i / 3) % 1 + 1) % 1;
      ctx.globalAlpha = (1 - t) * 0.55;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r * (1 + t * 1.6), 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawLabels(): void {
    const lo = this.opts.label;
    if (!lo) return;
    const L: CalendarLabelOptions = lo === true ? {} : lo;
    if (L.show === false) return;
    const ctx = this.ctx;
    const pos = L.position ?? 'center';
    for (const c of this.list) {
      const raw = L.format ? L.format(c) : String(c.date.getDate());
      const lines = (Array.isArray(raw) ? raw : [raw]).filter((s) => s !== '');
      if (!lines.length) continue;
      const size = L.fontSize ?? clamp(Math.min(c.w, c.h) * 0.3, 8, 14);
      ctx.fillStyle = L.color ?? this.labelColor(c);
      lines.forEach((text, i) => {
        // the first line a bit bigger and bold, the next ones smaller
        const s = i === 0 ? size : size * 0.78;
        ctx.font = this.font(s, i === 0 ? 600 : 400);
        if (pos === 'center') {
          const lh = size * 1.2;
          const y = c.y + c.h / 2 - ((lines.length - 1) * lh) / 2 + i * lh;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, c.x + c.w / 2, y, c.w - 4);
        } else {
          ctx.textAlign = pos === 'top' ? 'center' : 'left';
          ctx.textBaseline = 'top';
          const x = pos === 'top' ? c.x + c.w / 2 : c.x + 5;
          ctx.fillText(text, x, c.y + 4 + i * size * 1.15, c.w - 8);
        }
      });
    }
  }

  /** Readable text over the cell color. */
  private labelColor(c: Cell): string {
    if ((this.opts.type ?? 'heatmap') !== 'heatmap' || c.color === this.cellColor()) return this.theme.text;
    const m = c.color.match(/\d+(\.\d+)?/g);
    let rgb: number[] | null = m && c.color.startsWith('rgb') ? m.slice(0, 3).map(Number) : null;
    if (!rgb && c.color[0] === '#') {
      const h = c.color.length === 4 ? [...c.color.slice(1)].map((x) => x + x).join('') : c.color.slice(1, 7);
      const n = parseInt(h, 16);
      rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    if (!rgb) return this.theme.text;
    return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] > 150 ? '#131722' : '#ffffff';
  }

  /** Line around each month. */
  private drawSplit(): void {
    const sl = opt(this.opts.splitLine, true) as { show: boolean; color?: string; width?: number };
    if (!sl.show) return;
    const ctx = this.ctx;
    ctx.strokeStyle = sl.color ?? this.theme.splitLine;
    ctx.lineWidth = sl.width ?? 1.5;
    ctx.lineCap = 'square';
    ctx.beginPath();
    for (const g of this.grids) {
      const at = new Map(g.days.map((d) => [`${d.col},${d.row}`, d]));
      for (const d of g.days) {
        const c = this.byKey.get(d.key)!;
        const [top, right, bottom, left] = monthEdges(d, at);
        if (top) this.seg(c.x, c.y, c.x + c.w, c.y);
        if (right) this.seg(c.x + c.w, c.y, c.x + c.w, c.y + c.h);
        if (bottom) this.seg(c.x, c.y + c.h, c.x + c.w, c.y + c.h);
        if (left) this.seg(c.x, c.y, c.x, c.y + c.h);
      }
    }
    ctx.stroke();
  }

  private seg(x0: number, y0: number, x1: number, y1: number): void {
    this.ctx.moveTo(x0, y0);
    this.ctx.lineTo(x1, y1);
  }

  /** Weekday, month and year names. */
  private drawAxisLabels(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const horizontal = (this.opts.orient ?? 'horizontal') === 'horizontal';
    const L = this.labels();
    const firstDay = this.opts.firstDay ?? 1;
    const names = L.day.names ?? DAY_NAMES;
    // names start on Monday; with Sunday first the last one moves to the front
    const dayNames = L.day.names ? names : firstDay === 0 ? [names[6], ...names.slice(0, 6)] : names;
    const months = L.month.names ?? MONTH_NAMES;
    for (const g of this.grids) {
      const o = this.origins[g.index];
      if (!o) continue;
      const fs = clamp(Math.min(o.cw, o.ch * 2) * 0.55, 8, 12);
      if (L.day.show) {
        ctx.fillStyle = L.day.color ?? t.muted;
        ctx.font = this.font(fs);
        for (let i = 0; i < 7; i++) {
          // with small cells only every other weekday (Seg, Qua, Sex, Dom) fits, and none with tiny ones
          if (horizontal && ((o.ch < 13 && i % 2) || o.ch < 6)) continue;
          if (horizontal) {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(dayNames[i], o.x - 6, o.y + (i + 0.5) * o.ch);
          } else {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(dayNames[i], o.x + (i + 0.5) * o.cw, o.y - 5);
          }
        }
      }
      if (L.month.show) {
        ctx.fillStyle = L.month.color ?? t.muted;
        ctx.font = this.font(fs + 0.5, 600);
        for (const m of g.months) {
          if (horizontal) {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(months[m.month], o.x + m.at * o.cw + 1, o.y - 5);
          } else {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(months[m.month], o.x - 6, o.y + (m.at + 0.5) * o.ch);
          }
        }
      }
      if (L.year.show) {
        ctx.fillStyle = L.year.color ?? t.text;
        ctx.font = this.font(13, 700);
        ctx.textAlign = 'center';
        if (horizontal) {
          ctx.save();
          ctx.translate(o.x - (L.day.show ? 30 : 0) - 12, o.y + 3.5 * o.ch);
          ctx.rotate(-Math.PI / 2);
          ctx.textBaseline = 'middle';
          ctx.fillText(g.year, 0, 0);
          ctx.restore();
        } else {
          ctx.textBaseline = 'bottom';
          ctx.fillText(g.year, o.x + 3.5 * o.cw, o.y - (L.day.show ? 22 : 4));
        }
      }
    }
  }

  // ------------------------------------------------------------------ interaction

  private bind(): void {
    const at = (e: PointerEvent | MouseEvent): Cell | null => {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      for (const c of this.list) if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) return c;
      return null;
    };
    this.canvas.addEventListener('pointermove', (e) => {
      const c = at(e);
      if (c !== this.hover) {
        this.hover = c;
        this.emit('hover', c);
        this.draw();
      }
      this.canvas.style.cursor = c ? 'pointer' : '';
      this.showTooltip(c, e);
    });
    this.canvas.addEventListener('pointerleave', () => {
      if (this.hover) {
        this.hover = null;
        this.emit('hover', null);
        this.draw();
      }
      this.tooltipEl.classList.remove('is-visible');
    });
    this.canvas.addEventListener('click', (e) => {
      const c = at(e);
      if (c) this.emit('click', c);
    });
    this.vmEl.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.cc-vm__piece');
      if (!b) return;
      const i = Number(b.dataset.i);
      if (this.off.has(i)) this.off.delete(i);
      else this.off.add(i);
      for (const c of this.list) c.color = this.fill(c);
      this.renderVisual();
      this.draw();
    });
  }

  private showTooltip(c: Cell | null, e: PointerEvent): void {
    const tt = this.opts.tooltip ?? true;
    const el = this.tooltipEl;
    if (!c || tt === false || (typeof tt === 'object' && tt.show === false)) {
      el.classList.remove('is-visible');
      return;
    }
    if (typeof tt === 'object' && tt.formatter) el.innerHTML = tt.formatter(c);
    else {
      const date = c.date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const fmt = this.opts.valueFormatter ?? ((v: number) => v.toLocaleString('pt-PT'));
      const scatter = (this.opts.type ?? 'heatmap') === 'scatter';
      const dot = c.value !== null && this.hasVisual() ? `<i class="cc-tooltip__dot" style="background:${scatter ? this.symbolColor(c) : c.color}"></i>` : '';
      el.innerHTML =
        `<div class="cc-tooltip__head">${dot}${esc(date)}</div>` +
        (c.value !== null ? `<div class="cc-tooltip__row"><span>Valor</span><b>${esc(fmt(c.value))}</b></div>` : '') +
        (c.datum?.label ? `<div class="cc-tooltip__row"><span>${esc(c.datum.label)}</span></div>` : '');
    }
    el.classList.add('is-visible');
    const r = this.plotEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = x + 14 + w > this.width ? x - 14 - w : x + 14;
    const top = clamp(y + 14 + h > this.height ? y - 14 - h : y + 14, 0, Math.max(0, this.height - h));
    el.style.transform = `translate(${Math.max(0, left)}px, ${top}px)`;
  }
}

/** [from, to] of one day range, not a list of two calendars. */
function isDayPair(r: unknown[]): boolean {
  return r.every((x) => x instanceof Date || (typeof x === 'string' && /^\d{4}-\d{1,2}-\d{1,2}/.test(x)) || (typeof x === 'number' && x > 1e5));
}

export function createCalendarChart(container: HTMLElement, options: CalendarOptions = {}): CalendarChart {
  return new CalendarChart(container, options);
}
