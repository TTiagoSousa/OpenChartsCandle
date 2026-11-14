import { gradientAt, parseColor } from '../shared/color';
import { formatCompact } from '../shared/format';
import { axisAngle, niceMax, pointInPolygon, polar, valueRadius } from './geometry';
import type { RadarCoord, RadarEvent, RadarHoverInfo, RadarIndicator, RadarItem, RadarOptions, RadarSeries, RadarSymbol, RadarTheme } from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const radarDarkTheme: RadarTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  grid: 'rgba(120, 123, 134, 0.35)',
  bands: ['rgba(42, 46, 57, 0.25)', 'rgba(42, 46, 57, 0.6)'],
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const radarLightTheme: RadarTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  grid: 'rgba(42, 46, 57, 0.18)',
  bands: ['rgba(240, 243, 250, 0.4)', 'rgba(224, 227, 235, 0.6)'],
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

export const RADAR_COLORS = ['#2962ff', '#ff9800', '#089981', '#f23645', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#ffc107', '#607d8b'];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const alpha = (c: string, a: number): string => {
  const [r, g, b, a0] = parseColor(c);
  return `rgba(${r}, ${g}, ${b}, ${+(a * a0).toFixed(3)})`;
};

/** A radar placed in px. */
interface Coord {
  o: RadarCoord;
  cx: number;
  cy: number;
  R: number;
  angles: number[];
  min: number[];
  max: number[];
}

interface ItemModel {
  name: string;
  value: (number | null)[];
  color: string;
  /** values as 0–1 of each axis (what is drawn) */
  t: number[];
  /** start of the animation */
  from: number[] | null;
  /** last drawn vertices */
  pts: { x: number; y: number }[];
}

interface SModel {
  key: string;
  src: RadarSeries;
  index: number;
  color: string;
  radar: number;
  items: ItemModel[];
}

type Hit = { m: SModel; i: number };

/**
 * Radar chart: values of several indicators on axes around a center, one polygon per series (or many per
 * series), with polygon or circle rings, bands, several radars in one chart, legend, tooltip and animations.
 */
export class RadarChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;
  private plotEl: HTMLElement;
  private legendEl: HTMLElement;
  private vmEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private opts: RadarOptions;
  private theme!: RadarTheme;
  private list: RadarSeries[] = [];
  private hiddenKeys = new Set<string>();
  private models: SModel[] = [];
  private coords: Coord[] = [];
  private hover: Hit | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animStart = 0;
  private raf = 0;
  private handlers = new Map<RadarEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;
  private destroyed = false;

  constructor(container: HTMLElement, options: RadarOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('rc-root');
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'rc-title';
    this.bodyEl = document.createElement('div');
    this.plotEl = document.createElement('div');
    this.plotEl.className = 'rc-plot';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'rc-canvas';
    this.canvas.setAttribute('role', 'img');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'rc-tooltip';
    this.vmEl = document.createElement('div');
    this.vmEl.className = 'rc-vm';
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

  get series(): RadarSeries[] {
    return this.list.map((s) => ({ ...s }));
  }

  /** Replace every series; polygons with the same series key and position move to their new values. */
  setSeries(series: RadarSeries[], animate = true): void {
    this.list = series.map((s) => ({ ...s }));
    for (const s of this.list) if (s.hidden) this.hiddenKeys.add(this.keyOf(s));
    this.rebuild(animate);
  }

  /** Change options after creation. */
  setOptions(patch: RadarOptions, animate = true): void {
    if (patch.series) this.list = patch.series.map((s) => ({ ...s }));
    this.opts = { ...this.opts, ...patch };
    this.applyLook();
    this.rebuild(animate);
  }

  /** Show / hide a series. */
  toggle(id: string, hidden?: boolean): void {
    const h = hidden ?? !this.hiddenKeys.has(id);
    if (h) this.hiddenKeys.add(id);
    else this.hiddenKeys.delete(id);
    this.emit('toggle', { id, hidden: h });
    this.renderLegend();
    this.draw();
  }

  on(event: 'hover', handler: (info: RadarHoverInfo | null) => void): () => void;
  on(event: 'click', handler: (info: RadarHoverInfo) => void): () => void;
  on(event: 'toggle', handler: (e: { id: string; hidden: boolean }) => void): () => void;
  on(event: RadarEvent, handler: (v: never) => void): () => void {
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
    this.root.classList.remove('rc-root');
    this.titleEl.remove();
    this.bodyEl.remove();
  }

  // ------------------------------------------------------------------ model

  private keyOf(s: RadarSeries): string {
    return s.id ?? s.name;
  }

  private emit(e: RadarEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? radarLightTheme : radarDarkTheme;
    const t: RadarTheme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background) t.background = o.background;
    this.theme = t;
    const vars: Record<string, string> = {
      '--rc-bg': t.background,
      '--rc-text': t.text,
      '--rc-muted': t.muted,
      '--rc-tt-bg': t.tooltipBg,
      '--rc-tt-text': t.tooltipText,
      '--rc-tt-border': t.tooltipBorder,
      '--rc-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    const title = typeof o.title === 'string' ? { text: o.title } : o.title;
    this.titleEl.style.display = title ? '' : 'none';
    if (title) {
      this.titleEl.style.textAlign = title.align ?? 'center';
      this.titleEl.innerHTML = `<b>${esc(title.text)}</b>${title.subtext ? `<small>${esc(title.subtext)}</small>` : ''}`;
    }
  }

  /** The radars: `radars`, or the top-level radar options. */
  private radarList(): RadarCoord[] {
    const o = this.opts;
    if (o.radars?.length) return o.radars;
    // the chart title is not the radar's
    const { title: _title, ...rest } = o;
    return [{ ...rest, indicators: o.indicators ?? [] } as RadarCoord];
  }

  private items(s: RadarSeries): RadarItem[] {
    const d = s.data as unknown[];
    if (!d.length) return [];
    return typeof d[0] === 'number' || d[0] === null ? [{ value: d as (number | null)[] }] : (d as RadarItem[]);
  }

  private rebuild(animate: boolean): void {
    const palette = this.opts.colors ?? RADAR_COLORS;
    const vm = this.opts.visualMap;
    const old = new Map(this.models.map((m) => [m.key, m]));
    const radars = this.radarList();
    this.models = this.list.map((s, index) => {
      const key = this.keyOf(s);
      const color = s.color ?? palette[index % palette.length];
      const prev = old.get(key);
      const src = this.items(s);
      return {
        key,
        src: s,
        index,
        color,
        radar: clamp(s.radar ?? 0, 0, radars.length - 1),
        items: src.map((it, i) => ({
          name: it.name ?? s.name,
          value: it.value,
          color: it.color ?? (vm ? gradientAt(vm.colors, src.length > 1 ? i / (src.length - 1) : 0) : color),
          t: [],
          from: prev?.items[i]?.t.length ? [...prev.items[i].t] : null,
          pts: [],
        })),
      };
    });
    // the scale of each axis: given, or the biggest value of the series on that radar
    this.coords = radars.map((r, ri) => {
      const n = r.indicators.length;
      const max: number[] = [];
      const min: number[] = [];
      for (let k = 0; k < n; k++) {
        const ind = r.indicators[k];
        let hi = -Infinity;
        for (const m of this.models) if (m.radar === ri) for (const it of m.items) hi = Math.max(hi, it.value[k] ?? -Infinity);
        min[k] = ind.min ?? 0;
        max[k] = ind.max ?? niceMax(hi);
      }
      return { o: r, cx: 0, cy: 0, R: 0, angles: r.indicators.map((_, k) => axisAngle(k, n, r.startAngle ?? 90, r.clockwise ?? true)), min, max };
    });
    for (const m of this.models) {
      const c = this.coords[m.radar];
      for (const it of m.items) it.t = c.o.indicators.map((_, k) => valueRadius(it.value[k] ?? null, c.min[k], c.max[k], 1));
    }
    const a = this.opts.animation ?? true;
    const on = animate && a !== false;
    // first draw: polygons grow from the center
    for (const m of this.models) for (const it of m.items) if (!it.from) it.from = on ? it.t.map(() => 0) : null;
    if (!on) for (const m of this.models) for (const it of m.items) it.from = null;
    this.animStart = on ? performance.now() : 0;
    this.renderLegend();
    this.renderVisual();
    this.layout();
    this.loop();
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 700) : 700;
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
      for (const m of this.models) for (const it of m.items) it.from = null;
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
    this.bodyEl.className = `rc-body rc-legend-${L.position}`;
    this.legendEl.className = 'rc-legend';
    this.legendEl.style.display = L.show ? '' : 'none';
    if (!L.show) return;
    this.legendEl.innerHTML = this.models
      .map((m) => {
        const hidden = this.hiddenKeys.has(m.key);
        return `<li class="rc-legend__item${L.interactive ? ' is-interactive' : ''}${hidden ? ' is-hidden' : ''}" data-key="${esc(m.key)}"><i class="rc-legend__marker" style="--c:${m.color}"></i><span>${esc(m.src.name)}</span></li>`;
      })
      .join('');
  }

  private renderVisual(): void {
    const vm = this.opts.visualMap;
    const first = this.models[0]?.items ?? [];
    if (!vm || vm.show === false || first.length < 2) {
      this.vmEl.style.display = 'none';
      return;
    }
    this.vmEl.style.display = '';
    this.vmEl.innerHTML =
      (vm.title ? `<span class="rc-vm__title">${esc(vm.title)}</span>` : '') +
      `<span>${esc(first[0].name)}</span><span class="rc-vm__bar" style="background:linear-gradient(to right,${vm.colors.join(',')})"></span><span>${esc(first[first.length - 1].name)}</span>`;
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

  private layout(): void {
    const pad = this.opts.padding ?? 10;
    const vmH = this.vmEl.style.display === 'none' ? 0 : 26;
    const W = this.width - pad * 2;
    const H = this.height - pad * 2 - vmH;
    const half = Math.min(W, H) / 2;
    for (const c of this.coords) {
      const [px, py] = c.o.center ?? [50, 50];
      c.cx = pad + (W * px) / 100;
      c.cy = pad + (H * py) / 100;
    }
    for (const c of this.coords) {
      // the space of this radar: the chart, cut halfway to the radars next to it
      let left = pad;
      let right = pad + W;
      let top = pad + (c.o.title ? 20 : 0);
      let bottom = pad + H;
      for (const o of this.coords) {
        if (o === c) continue;
        if (Math.abs(o.cy - c.cy) < H / 4) {
          if (o.cx > c.cx) right = Math.min(right, (o.cx + c.cx) / 2);
          else if (o.cx < c.cx) left = Math.max(left, (o.cx + c.cx) / 2);
        }
        if (Math.abs(o.cx - c.cx) < W / 4) {
          if (o.cy > c.cy) bottom = Math.min(bottom, (o.cy + c.cy) / 2);
          else if (o.cy < c.cy) top = Math.max(top, (o.cy + c.cy) / 2);
        }
      }
      const R0 = (half * (c.o.radius ?? 70)) / 100;
      let R = R0;
      // shrink until every axis name fits in that space
      const an = c.o.axisName ?? true;
      const s = typeof an === 'object' ? an : {};
      const fs = s.fontSize ?? 12;
      const gap = 10 + (s.padding ?? (s.background ? 4 : 0)) * 2;
      this.ctx.font = this.font(fs, 500);
      c.o.indicators.forEach((ind, k) => {
        const a = c.angles[k];
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const text = an ? (s.format ? s.format(ind.name, ind) : ind.name) : '';
        const lines = text ? text.split('\n') : [];
        const w = lines.length ? Math.max(...lines.map((l) => this.ctx.measureText(l).width)) : 0;
        const h = lines.length * fs * 1.2;
        // the name sits beyond the ring: centered on vertical axes, to one side on the others
        const wx = Math.abs(cos) > 0.15 ? w : w / 2;
        const hy = Math.abs(sin) > 0.15 ? h : h / 2;
        if (cos > 0.01) R = Math.min(R, (right - c.cx - gap - wx) / cos);
        if (cos < -0.01) R = Math.min(R, (c.cx - left - gap - wx) / -cos);
        if (sin > 0.01) R = Math.min(R, (c.cy - top - gap - hy) / sin);
        if (sin < -0.01) R = Math.min(R, (bottom - c.cy - gap - hy) / -sin);
        if (Math.abs(cos) <= 0.01) R = Math.min(R, right - c.cx - w / 2, c.cx - left - w / 2);
      });
      // in very small boxes the names may overlap a little rather than leave a dot of a radar
      c.R = Math.max(8, R, R0 * 0.5);
    }
  }

  // ------------------------------------------------------------------ drawing

  private font(size: number, weight: number | string = 400): string {
    return `${weight} ${size}px ${this.theme.font}`;
  }

  private ring(c: Coord, r: number, circle: boolean): void {
    const ctx = this.ctx;
    if (circle) {
      ctx.moveTo(c.cx + r, c.cy);
      ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
      return;
    }
    c.angles.forEach((a, k) => {
      const p = polar(c.cx, c.cy, r, a);
      if (k) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    });
    ctx.closePath();
  }

  private drawGrid(c: Coord): void {
    const ctx = this.ctx;
    const t = this.theme;
    const o = c.o;
    const n = o.splitNumber ?? 5;
    const circle = o.shape === 'circle';
    if (o.splitArea) {
      const colors = (typeof o.splitArea === 'object' && o.splitArea.colors) || t.bands;
      for (let k = n; k >= 1; k--) {
        ctx.beginPath();
        this.ring(c, (c.R * k) / n, circle);
        if (k > 1) this.ring(c, (c.R * (k - 1)) / n, circle);
        ctx.fillStyle = colors[(k - 1) % colors.length];
        ctx.fill('evenodd');
      }
    }
    const sl = o.splitLine ?? true;
    if (sl) {
      const s = typeof sl === 'object' ? sl : {};
      ctx.strokeStyle = s.color ?? t.grid;
      ctx.lineWidth = s.width ?? 1;
      ctx.setLineDash(s.dash ?? []);
      for (let k = 1; k <= n; k++) {
        ctx.beginPath();
        this.ring(c, (c.R * k) / n, circle);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    const al = o.axisLine ?? true;
    if (al) {
      ctx.strokeStyle = (typeof al === 'object' && al.color) || t.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const a of c.angles) {
        const p = polar(c.cx, c.cy, c.R, a);
        ctx.moveTo(c.cx, c.cy);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }

  private drawNames(c: Coord): void {
    const ctx = this.ctx;
    const o = c.o;
    const an = o.axisName ?? true;
    if (an) {
      const s = typeof an === 'object' ? an : {};
      const fs = s.fontSize ?? 12;
      ctx.font = this.font(fs, 500);
      c.o.indicators.forEach((ind, k) => {
        const a = c.angles[k];
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const pad = s.padding ?? (s.background ? 4 : 0);
        const p = polar(c.cx, c.cy, c.R + 10 + pad, a);
        const text = s.format ? s.format(ind.name, ind) : ind.name;
        const lines = text.split('\n');
        const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const h = lines.length * fs * 1.2;
        // the box grows away from the center
        const x0 = cos > 0.15 ? p.x : cos < -0.15 ? p.x - w : p.x - w / 2;
        const y0 = sin > 0.15 ? p.y - h : sin < -0.15 ? p.y : p.y - h / 2;
        if (s.background) {
          ctx.fillStyle = s.background;
          ctx.beginPath();
          ctx.roundRect(x0 - pad, y0 - pad, w + pad * 2, h + pad * 2, s.borderRadius ?? 3);
          ctx.fill();
        }
        ctx.fillStyle = ind.color ?? s.color ?? this.theme.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        lines.forEach((l, i) => ctx.fillText(l, x0 + (w - ctx.measureText(l).width) / 2, y0 + i * fs * 1.2 + fs * 0.1));
      });
    }
    const al = o.axisLabel;
    if (al) {
      const s = typeof al === 'object' ? al : {};
      const n = o.splitNumber ?? 5;
      ctx.font = this.font(10);
      ctx.fillStyle = s.color ?? this.theme.muted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const a = c.angles[0];
      for (let k = 1; k <= n; k++) {
        const v = c.min[0] + ((c.max[0] - c.min[0]) * k) / n;
        const p = polar(c.cx, c.cy, (c.R * k) / n, a);
        ctx.fillText(s.format ? s.format(v) : formatCompact(v), p.x + 4, p.y);
      }
    }
    if (o.title) {
      ctx.font = this.font(13, 600);
      ctx.fillStyle = this.theme.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(o.title, c.cx, (this.opts.padding ?? 10) + 16);
    }
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
    for (const c of this.coords) this.drawGrid(c);
    const p = this.progress(now);
    const dim = this.opts.hoverDim ?? 0.25;
    const visible = this.models.filter((m) => !this.hiddenKeys.has(m.key));
    // vertices of every polygon at this frame
    for (const m of visible) {
      const c = this.coords[m.radar];
      for (const it of m.items) {
        it.pts = c.angles.map((a, k) => {
          const f = it.from ? it.from[k] ?? 0 : it.t[k];
          return polar(c.cx, c.cy, c.R * (f + (it.t[k] - f) * p), a);
        });
      }
    }
    for (const m of visible)
      m.items.forEach((it, i) => {
        const hovered = this.hover?.m === m && this.hover.i === i;
        if (!hovered) this.drawItem(m, it, this.hover ? dim : 1, false);
      });
    if (this.hover && visible.includes(this.hover.m)) this.drawItem(this.hover.m, this.hover.m.items[this.hover.i], 1, true);
    for (const c of this.coords) this.drawNames(c);
  }

  private drawItem(m: SModel, it: ItemModel, a: number, hovered: boolean): void {
    const ctx = this.ctx;
    const s = m.src;
    const c = this.coords[m.radar];
    if (!it.pts.length) return;
    const path = (): void => {
      ctx.beginPath();
      it.pts.forEach((q, k) => (k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.closePath();
    };
    ctx.globalAlpha = a;
    if (s.area) {
      const cfg = typeof s.area === 'object' ? s.area : {};
      const op = (cfg.opacity ?? 0.25) + (hovered ? 0.1 : 0);
      if (cfg.gradient) {
        const g = ctx.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, c.R);
        const cols = Array.isArray(cfg.gradient) ? cfg.gradient : [alpha(it.color, 0.05), alpha(it.color, 1)];
        cols.forEach((col, i) => g.addColorStop(cols.length > 1 ? i / (cols.length - 1) : 0, alpha(col, op)));
        ctx.fillStyle = g;
      } else ctx.fillStyle = alpha(it.color, op);
      path();
      ctx.fill();
    }
    const w = s.width ?? 2;
    if (w > 0) {
      ctx.strokeStyle = it.color;
      ctx.lineWidth = w + (hovered ? 1 : 0);
      ctx.lineJoin = 'round';
      ctx.setLineDash(s.dash ?? []);
      path();
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const pt = s.points ?? true;
    if (pt) {
      const cfg = typeof pt === 'object' ? pt : {};
      const sym = cfg.symbol ?? 'circle';
      if (sym !== 'none') {
        const r = (cfg.size ?? 4) + (hovered ? 1.5 : 0);
        for (const q of it.pts) this.symbol(sym, q.x, q.y, r, it.color, cfg.hollow ?? false);
      }
    }
    if (s.labels) {
      const cfg = typeof s.labels === 'object' ? s.labels : {};
      ctx.font = this.font(11, 600);
      ctx.fillStyle = cfg.color ?? it.color;
      ctx.textBaseline = 'middle';
      it.pts.forEach((q, k) => {
        const v = it.value[k];
        if (v === null || v === undefined) return;
        const ind = c.o.indicators[k];
        const ang = c.angles[k];
        const lp = polar(q.x, q.y, 12, ang);
        ctx.textAlign = Math.cos(ang) > 0.15 ? 'left' : Math.cos(ang) < -0.15 ? 'right' : 'center';
        ctx.fillText(cfg.format ? cfg.format(v, ind) : this.fmt(v, ind), lp.x, lp.y);
      });
    }
    ctx.globalAlpha = 1;
  }

  private symbol(sym: RadarSymbol, x: number, y: number, r: number, color: string, hollow: boolean): void {
    const ctx = this.ctx;
    ctx.beginPath();
    if (sym === 'square') ctx.rect(x - r, y - r, r * 2, r * 2);
    else if (sym === 'diamond') {
      ctx.moveTo(x, y - r * 1.3);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r * 1.3);
      ctx.lineTo(x - r, y);
      ctx.closePath();
    } else if (sym === 'triangle') {
      ctx.moveTo(x, y - r * 1.2);
      ctx.lineTo(x + r * 1.1, y + r * 0.8);
      ctx.lineTo(x - r * 1.1, y + r * 0.8);
      ctx.closePath();
    } else ctx.arc(x, y, r, 0, Math.PI * 2);
    if (hollow) {
      ctx.fillStyle = this.theme.background === 'transparent' ? '#ffffff' : this.theme.background;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  private fmt(v: number, ind: RadarIndicator): string {
    return this.opts.valueFormatter ? this.opts.valueFormatter(v, ind) : v.toLocaleString('pt-PT');
  }

  // ------------------------------------------------------------------ interaction

  private info(h: Hit): RadarHoverInfo {
    const it = h.m.items[h.i];
    return { series: h.m.src, seriesIndex: h.m.index, index: h.i, name: it.name, value: it.value, color: it.color, indicators: this.coords[h.m.radar].o.indicators };
  }

  /** Polygon under the mouse: a vertex near it, or the smallest polygon around it. */
  private hitTest(x: number, y: number): Hit | null {
    const visible = this.models.filter((m) => !this.hiddenKeys.has(m.key));
    let best: Hit | null = null;
    let bestD = 64;
    for (const m of visible)
      m.items.forEach((it, i) => {
        for (const q of it.pts) {
          const d = (q.x - x) ** 2 + (q.y - y) ** 2;
          if (d < bestD) {
            bestD = d;
            best = { m, i };
          }
        }
      });
    if (best) return best;
    let area = Infinity;
    for (const m of visible)
      m.items.forEach((it, i) => {
        if (!pointInPolygon(x, y, it.pts)) return;
        let a = 0;
        for (let k = 0, j = it.pts.length - 1; k < it.pts.length; j = k++) a += it.pts[j].x * it.pts[k].y - it.pts[k].x * it.pts[j].y;
        if (Math.abs(a) < area) {
          area = Math.abs(a);
          best = { m, i };
        }
      });
    return best;
  }

  private bind(): void {
    const pos = (e: MouseEvent): { x: number; y: number } => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.canvas.addEventListener('pointermove', (e) => {
      const { x, y } = pos(e);
      const h = this.hitTest(x, y);
      const same = h && this.hover && h.m === this.hover.m && h.i === this.hover.i;
      if (!same && (h || this.hover)) {
        this.hover = h;
        this.emit('hover', h ? this.info(h) : null);
        this.draw();
      }
      this.canvas.style.cursor = h ? 'pointer' : '';
      this.showTooltip(e);
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
      const { x, y } = pos(e);
      const h = this.hitTest(x, y);
      if (h) this.emit('click', this.info(h));
    });
    this.legendEl.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>('.rc-legend__item');
      if (!li || !this.legendCfg().interactive) return;
      this.toggle(li.dataset.key!);
    });
  }

  private showTooltip(e: PointerEvent): void {
    const tt = this.opts.tooltip ?? true;
    const el = this.tooltipEl;
    const h = this.hover;
    if (!h || tt === false || (typeof tt === 'object' && tt.show === false)) {
      el.classList.remove('is-visible');
      return;
    }
    const info = this.info(h);
    if (typeof tt === 'object' && tt.formatter) el.innerHTML = tt.formatter(info);
    else {
      const head = info.name !== h.m.src.name ? `<div class="rc-tooltip__sub">${esc(h.m.src.name)}</div>` : '';
      el.innerHTML =
        `<div class="rc-tooltip__head"><i class="rc-tooltip__dot" style="background:${info.color}"></i>${esc(info.name)}</div>${head}` +
        info.indicators.map((ind, k) => `<div class="rc-tooltip__row"><span>${esc(ind.name)}</span><b>${info.value[k] === null || info.value[k] === undefined ? '–' : esc(this.fmt(info.value[k]!, ind))}</b></div>`).join('');
    }
    el.classList.add('is-visible');
    const r = this.plotEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const w = el.offsetWidth;
    const hh = el.offsetHeight;
    const left = x + 14 + w > this.width ? x - 14 - w : x + 14;
    const top = clamp(y + 14 + hh > this.height ? y - 14 - hh : y + 14, 0, Math.max(0, this.height - hh));
    el.style.transform = `translate(${Math.max(0, left)}px, ${top}px)`;
  }
}

export function createRadarChart(container: HTMLElement, options: RadarOptions = {}): RadarChart {
  return new RadarChart(container, options);
}
