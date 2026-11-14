import { formatCompact } from '../shared/format';
import { Arc, angleToValue, arcBounds, clamp, gaugeArc, gaugeTicks, springEase, valueToAngle, zoneAt } from './geometry';
import type { GaugeEvent, GaugeMarker, GaugeOptions, GaugeTheme, GaugeZone } from './types';

const FONT = '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif';

export const gaugeDarkTheme: GaugeTheme = {
  background: '#131722',
  text: '#d1d4dc',
  muted: '#787b86',
  track: 'rgba(120, 123, 134, 0.18)',
  needle: '#d1d4dc',
  tooltipBg: '#1e222d',
  tooltipText: '#d1d4dc',
  tooltipBorder: '#2a2e39',
  font: FONT,
};

export const gaugeLightTheme: GaugeTheme = {
  background: '#ffffff',
  text: '#131722',
  muted: '#787b86',
  track: 'rgba(42, 46, 57, 0.08)',
  needle: '#131722',
  tooltipBg: '#ffffff',
  tooltipText: '#131722',
  tooltipBorder: '#e0e3eb',
  font: FONT,
};

/** Ready-made zones: green → yellow → red over [min, max] (e.g. RPM, risk). */
export function trafficZones(min: number, max: number, split: [number, number] = [0.6, 0.85]): GaugeZone[] {
  const a = min + (max - min) * split[0];
  const b = min + (max - min) * split[1];
  return [
    { from: min, to: a, color: '#089981', label: 'Normal' },
    { from: a, to: b, color: '#ffb300', label: 'Atenção' },
    { from: b, to: max, color: '#f23645', label: 'Crítico' },
  ];
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Gauge / speedometer: needle and/or progress arc, colored zones or gradient track,
 * major and minor ticks, markers, value with unit and title, tooltip and spring animation.
 */
export class GaugeChart {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tooltipEl: HTMLElement;
  private opts: GaugeOptions;
  private theme!: GaugeTheme;
  private target = 0;
  private shown = 0;
  private from = 0;
  private animStart = 0;
  private raf = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private cx = 0;
  private cy = 0;
  private radius = 0;
  private arc: Arc = gaugeArc();
  private lastZone: GaugeZone | null = null;
  /** animated values of `pointers` / `rings` */
  private extraShown: number[] = [];
  private extraFrom: number[] = [];
  private hovered: GaugeZone | GaugeMarker | null = null;
  private handlers = new Map<GaugeEvent, Set<(v: unknown) => void>>();
  private ro: ResizeObserver;

  constructor(container: HTMLElement, options: GaugeOptions = {}) {
    this.opts = { ...options };
    this.root = container;
    container.classList.add('gc-root');
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'gc-canvas';
    this.canvas.setAttribute('role', 'meter');
    this.ctx = this.canvas.getContext('2d')!;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'gc-tooltip';
    container.append(this.canvas, this.tooltipEl);
    this.applyLook();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    const v = this.clampValue(options.value ?? this.min);
    this.target = v;
    this.lastZone = zoneAt(v, this.opts.zones);
    this.shown = this.min;
    this.animateTo(v);
    this.updateAria();
  }

  // ------------------------------------------------------------------ public API

  get value(): number {
    return this.target;
  }

  /** Move the needle (animated unless `animate` is false). Values outside min/max are clamped on the dial. */
  setValue(value: number, animate = true): void {
    this.target = value;
    this.updateAria();
    this.emit('change', value);
    const z = zoneAt(value, this.opts.zones);
    if (z !== this.lastZone) {
      this.lastZone = z;
      this.emit('zone', z);
    }
    if (animate) this.animateTo(value);
    else {
      cancelAnimationFrame(this.raf);
      this.shown = this.clampValue(value);
      this.draw();
    }
  }

  /** Change options after creation (needles, pointers and rings animate to new values). */
  setOptions(patch: GaugeOptions, animate = true): void {
    this.opts = { ...this.opts, ...patch };
    this.applyLook();
    this.layout();
    if (patch.value !== undefined) this.setValue(patch.value, animate);
    else if (patch.pointers || patch.rings) {
      if (animate) this.animateTo(this.target);
      else {
        cancelAnimationFrame(this.raf);
        this.extraShown = this.extraTargets();
        this.draw();
      }
    } else this.draw();
  }

  on(event: 'change', handler: (value: number) => void): () => void;
  on(event: 'zone', handler: (zone: GaugeZone | null) => void): () => void;
  on(event: GaugeEvent, handler: (v: never) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as (v: unknown) => void;
    this.handlers.get(event)!.add(h);
    return () => this.handlers.get(event)?.delete(h);
  }

  screenshot(): string {
    this.draw();
    return this.canvas.toDataURL('image/png');
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.root.classList.remove('gc-root');
    this.canvas.remove();
    this.tooltipEl.remove();
  }

  // ------------------------------------------------------------------ model

  private get min(): number {
    return this.opts.min ?? 0;
  }

  private get max(): number {
    return this.opts.max ?? 100;
  }

  private clampValue(v: number): number {
    return clamp(v, Math.min(this.min, this.max), Math.max(this.min, this.max));
  }

  private emit(e: GaugeEvent, v: unknown): void {
    this.handlers.get(e)?.forEach((h) => h(v));
  }

  private fmt(v: number): string {
    if (this.opts.valueFormatter) return this.opts.valueFormatter(v);
    // small ranges (0–10) keep one decimal, bigger ones show whole numbers
    return Math.abs(v) >= 1e4 ? formatCompact(v, 1) : v.toFixed(Math.abs(this.max - this.min) <= 10 ? 1 : 0);
  }

  private updateAria(): void {
    this.canvas.setAttribute('aria-valuemin', String(this.min));
    this.canvas.setAttribute('aria-valuemax', String(this.max));
    this.canvas.setAttribute('aria-valuenow', String(this.target));
    this.canvas.setAttribute('aria-label', `${this.opts.title ?? 'Gauge'}: ${this.fmt(this.target)}${this.opts.unit ? ' ' + this.opts.unit : ''}`);
  }

  private applyLook(): void {
    const o = this.opts;
    const base = o.theme === 'light' ? gaugeLightTheme : gaugeDarkTheme;
    this.theme = { ...base, ...(typeof o.theme === 'object' ? o.theme : {}) };
    if (o.background !== undefined) this.theme.background = o.background;
    const t = this.theme;
    const vars: Record<string, string> = {
      '--gc-bg': t.background,
      '--gc-text': t.text,
      '--gc-tt-bg': t.tooltipBg,
      '--gc-tt-text': t.tooltipText,
      '--gc-tt-border': t.tooltipBorder,
      '--gc-font': t.font,
    };
    for (const [k, v] of Object.entries(vars)) this.root.style.setProperty(k, v);
    this.arc = gaugeArc(o.shape ?? 'speedometer', o.startAngle, o.endAngle);
  }

  private duration(): number {
    const a = this.opts.animation ?? true;
    return a === false ? 0 : typeof a === 'object' ? (a.duration ?? 1100) : 1100;
  }

  private ease(t: number): number {
    const a = this.opts.animation;
    const kind = typeof a === 'object' ? (a.easing ?? 'spring') : 'spring';
    return kind === 'linear' ? t : kind === 'smooth' ? easeOutCubic(t) : springEase(t);
  }

  private extraTargets(): number[] {
    return (this.opts.pointers ?? this.opts.rings ?? []).map((p) => this.clampValue(p.value));
  }

  /** animate the main value and every pointer / ring together */
  private animateTo(v: number): void {
    cancelAnimationFrame(this.raf);
    const to = this.clampValue(v);
    const extraTo = this.extraTargets();
    const dur = this.duration();
    if (!dur) {
      this.shown = to;
      this.extraShown = extraTo;
      this.draw();
      return;
    }
    this.from = this.shown;
    this.extraFrom = extraTo.map((_, i) => this.extraShown[i] ?? this.min);
    this.animStart = performance.now();
    const step = (now: number): void => {
      const k = Math.min(1, (now - this.animStart) / dur);
      const e = this.ease(k);
      // overshoot may pass the ends a little, but never past the dial limits
      this.shown = this.clampValue(this.from + (to - this.from) * e);
      this.extraShown = extraTo.map((t, i) => this.clampValue(this.extraFrom[i] + (t - this.extraFrom[i]) * e));
      this.draw();
      if (k < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  // ------------------------------------------------------------------ layout

  private resize(): void {
    const r = this.root.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.layout();
    this.draw();
  }

  private get full(): boolean {
    return this.arc.end - this.arc.start >= Math.PI * 2 - 1e-6;
  }

  private layout(): void {
    const pad = this.opts.padding ?? 10;
    const b = arcBounds(this.arc);
    // room below the arc for min/max labels and the title on open dials
    const outsideTicks = this.opts.ticks?.position === 'outside' && this.opts.ticks?.show !== false;
    const extraR = outsideTicks || this.opts.markers?.length ? 0.16 : 0.02;
    // dials open at the bottom (semi) put the value under the hub when there is a needle
    const bottomText = this.full ? 0 : this.textBelowHub ? 0.62 : 0.18;
    const w = Math.max(10, this.width - pad * 2);
    const h = Math.max(10, this.height - pad * 2);
    const spanX = b.maxX - b.minX + extraR * 2;
    const spanY = b.maxY - b.minY + extraR * 2 + (this.full ? 0 : Math.max(0, bottomText - (b.maxY > 0.3 ? 0.1 : 0)));
    this.radius = Math.max(10, Math.min(w / spanX, h / spanY));
    const usedW = spanX * this.radius;
    const usedH = spanY * this.radius;
    this.cx = pad + (w - usedW) / 2 + (-b.minX + extraR) * this.radius;
    this.cy = pad + (h - usedH) / 2 + (-b.minY + extraR) * this.radius;
  }

  /** semi-like dial (nothing under the center) with a needle: the value goes below the hub */
  private get textBelowHub(): boolean {
    return !this.full && this.needleOpts().show && arcBounds(this.arc).maxY < 0.3;
  }

  private get thickness(): number {
    const t = this.opts.thickness ?? 0.16;
    return t <= 1 ? Math.max(3, this.radius * t) : t;
  }

  // ------------------------------------------------------------------ drawing

  private draw(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const o = this.opts;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (t.background !== 'transparent') {
      ctx.fillStyle = t.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (o.rings?.length) {
      this.drawRings();
      return;
    }
    const R = this.radius;
    const th = this.thickness;
    const rMid = R - th / 2;
    const rounded = o.rounded ?? true;
    const needle = this.needleOpts();
    const zones = o.zones ?? [];
    const valueAngle = valueToAngle(this.shown, this.min, this.max, this.arc);
    const progress = o.progress ?? (!needle.show || (!zones.length && !o.gradient));

    // track
    ctx.lineWidth = th;
    ctx.lineCap = rounded && !this.full ? 'round' : 'butt';
    this.strokeArc(rMid, this.arc.start, this.arc.end, t.track);

    // zones / gradient
    if (zones.length) {
      const gap = ((o.zoneGap ?? 1.2) * Math.PI) / 180;
      const sorted = [...zones].sort((a, b) => Math.min(a.from, a.to) - Math.min(b.from, b.to));
      sorted.forEach((z, i) => {
        let a0 = valueToAngle(Math.min(z.from, z.to), this.min, this.max, this.arc);
        let a1 = valueToAngle(Math.max(z.from, z.to), this.min, this.max, this.arc);
        const first = i === 0 && a0 <= this.arc.start + 1e-6;
        const last = i === sorted.length - 1 && a1 >= this.arc.end - 1e-6;
        if (!first) a0 += gap / 2;
        if (!last) a1 -= gap / 2;
        if (a1 <= a0) return;
        const dim = progress && this.shown < Math.min(z.from, z.to) ? 0.35 : 1;
        const hov = this.hovered === z;
        ctx.save();
        ctx.globalAlpha = dim;
        ctx.lineWidth = hov ? th + 4 : th;
        this.strokeArcCapped(rMid, a0, a1, z.color, rounded && first && !this.full, rounded && last && !this.full);
        ctx.restore();
      });
    } else if (o.gradient && o.gradient.length >= 2) {
      const g = this.gradientFill(o.gradient);
      ctx.save();
      ctx.lineWidth = th;
      ctx.lineCap = rounded && !this.full ? 'round' : 'butt';
      if (progress) {
        ctx.globalAlpha = 0.25;
        this.strokeArc(rMid, this.arc.start, this.arc.end, g);
        ctx.globalAlpha = 1;
        if (valueAngle > this.arc.start + 1e-4) this.strokeArc(rMid, this.arc.start, valueAngle, g);
      } else this.strokeArc(rMid, this.arc.start, this.arc.end, g);
      ctx.restore();
    }
    if (progress && !zones.length && !o.gradient && valueAngle > this.arc.start + 1e-4) {
      const pc = typeof o.progress === 'object' && o.progress.color ? o.progress.color : '#2962ff';
      ctx.lineWidth = th;
      ctx.lineCap = rounded ? 'round' : 'butt';
      this.strokeArc(rMid, this.arc.start, valueAngle, pc);
    }

    this.drawTicks();
    this.drawZoneLabels();
    this.drawSecondaryScale();
    this.drawMarkers();
    if (o.pointers?.length) this.drawPointers();
    else if (needle.show) this.drawNeedle(valueAngle, needle);
    this.drawText();
  }

  /** several needles, then one hub on top */
  private drawPointers(): void {
    const base = this.needleOpts();
    const list = this.opts.pointers!;
    list.forEach((p, i) => {
      const v = this.extraShown[i] ?? this.min;
      const a = valueToAngle(v, this.min, this.max, this.arc);
      this.drawNeedle(a, {
        ...base,
        shape: p.shape ?? base.shape,
        color: p.color ?? base.color,
        width: p.width ?? base.width,
        length: p.length ?? base.length,
        hub: false,
      });
    });
    if (base.hub) this.drawHub(list[list.length - 1].color ?? base.color, Math.max(...list.map((p) => p.width ?? base.width)));
  }

  private drawHub(color: string, w: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, w * 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.theme.background === 'transparent' ? 'rgba(0,0,0,0.35)' : this.theme.background;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, w * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }

  /** zone names written on the dial, in the middle of each zone */
  private drawZoneLabels(): void {
    const zl = this.opts.zoneLabels;
    if (!zl) return;
    const cfg = typeof zl === 'object' ? zl : {};
    const ctx = this.ctx;
    const R = this.radius;
    const size = cfg.fontSize ?? clamp(R * 0.075, 10, 15);
    // inside the secondary scale when there is one, else just inside the arc
    const r = this.opts.secondaryScale ? this.secondaryGeom().labels - size * 1.6 : R - this.thickness - size * 1.6;
    ctx.save();
    ctx.font = `600 ${size}px ${this.theme.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const z of this.opts.zones ?? []) {
      if (!z.label) continue;
      const a = valueToAngle((z.from + z.to) / 2, this.min, this.max, this.arc);
      ctx.fillStyle = cfg.color ?? z.color;
      ctx.fillText(z.label, this.cx + Math.cos(a) * r, this.cy + Math.sin(a) * r);
    }
    ctx.restore();
  }

  /** a second scale inside the main one, on the same angles */
  private drawSecondaryScale(): void {
    const sc = this.opts.secondaryScale;
    if (!sc) return;
    const ctx = this.ctx;
    const R = this.radius;
    const { base, labels: lr, size } = this.secondaryGeom();
    const color = sc.color ?? this.theme.muted;
    const angle = (v: number): number => this.arc.start + ((v - sc.min) / (sc.max - sc.min || 1)) * (this.arc.end - this.arc.start);
    const majors = gaugeTicks(sc.min, sc.max, sc.major ?? 6);
    const minor = sc.minor ?? 4;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, base, this.arc.start, this.arc.end);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < majors.length - 1; i++)
      for (let k = 1; k <= minor; k++) this.tickLine(angle(majors[i] + ((majors[i + 1] - majors[i]) * k) / (minor + 1)), base, base - Math.max(3, R * 0.03));
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const v of majors) this.tickLine(angle(v), base, base - Math.max(5, R * 0.06));
    ctx.stroke();
    ctx.font = `${size}px ${this.theme.font}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fmt = sc.format ?? ((v: number) => formatCompact(v));
    majors.forEach((v, i) => {
      if (this.full && i === majors.length - 1) return;
      const a = angle(v);
      ctx.fillText(fmt(v), this.cx + Math.cos(a) * lr, this.cy + Math.sin(a) * lr);
    });
    if (sc.label) {
      ctx.font = `600 ${size}px ${this.theme.font}`;
      ctx.fillText(sc.label, this.cx, this.cy - lr * 0.45);
    }
    ctx.restore();
  }

  /** radii of the secondary scale: its arc (base) and its labels */
  private secondaryGeom(): { base: number; labels: number; size: number } {
    const R = this.radius;
    const th = this.thickness;
    const main = this.opts.ticks ?? {};
    const mainInside = main.show !== false && (main.position ?? 'inside') === 'inside';
    const size = clamp(R * 0.07, 9, 12);
    // below the main labels when they are inside, else right under the arc
    const base = mainInside ? R - th - Math.max(6, R * 0.075) - clamp(R * 0.085, 9, 14) * 2.2 - 8 : R - th - 6;
    return { base, labels: base - Math.max(5, R * 0.06) - size * 1.1, size };
  }

  /** concentric progress rings, outer first, with the list of values in the center */
  private drawRings(): void {
    const ctx = this.ctx;
    const o = this.opts;
    const rings = o.rings!;
    const R = this.radius;
    const th = this.thickness;
    const gap = th * 0.35;
    const rounded = o.rounded ?? true;
    const palette = ['#2962ff', '#089981', '#ff9800', '#f23645', '#9c27b0'];
    rings.forEach((ring, i) => {
      const r = R - th / 2 - i * (th + gap);
      if (r <= th / 2) return;
      const color = ring.color ?? palette[i % palette.length];
      ctx.lineWidth = th;
      ctx.lineCap = 'butt';
      this.strokeArc(r, this.arc.start, this.arc.end, this.theme.track);
      const a = valueToAngle(this.extraShown[i] ?? this.min, this.min, this.max, this.arc);
      if (a > this.arc.start + 1e-4) {
        ctx.lineCap = rounded ? 'round' : 'butt';
        this.strokeArc(r, this.arc.start, a, color);
      }
    });
    // list in the center
    const inner = R - rings.length * (th + gap);
    const size = clamp(inner * 0.2, 10, 20);
    const lineH = size * 1.35;
    ctx.save();
    ctx.textBaseline = 'middle';
    const top = this.cy - ((rings.length - 1) * lineH) / 2 - (o.title ? lineH * 0.6 : 0);
    if (o.title) {
      ctx.font = `600 ${size * 0.8}px ${this.theme.font}`;
      ctx.fillStyle = this.theme.muted;
      ctx.textAlign = 'center';
      ctx.fillText(o.title, this.cx, top - lineH * 0.6);
    }
    rings.forEach((ring, i) => {
      const y = top + i * lineH + (o.title ? lineH * 0.6 : 0);
      const color = ring.color ?? palette[i % palette.length];
      const val = `${this.fmt(this.extraShown[i] ?? this.min)}${o.unit ?? ''}`;
      ctx.font = `500 ${size * 0.8}px ${this.theme.font}`;
      ctx.fillStyle = this.theme.muted;
      ctx.textAlign = 'right';
      ctx.fillText(ring.label ?? '', this.cx - 4, y);
      ctx.font = `700 ${size}px ${this.theme.font}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(val, this.cx + 4, y);
    });
    ctx.restore();
  }

  private strokeArc(r: number, a0: number, a1: number, style: string | CanvasGradient): void {
    const ctx = this.ctx;
    ctx.strokeStyle = style;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, r, a0, a1);
    ctx.stroke();
  }

  /** Arc with a round cap only on the requested ends (zones in the middle stay square). */
  private strokeArcCapped(r: number, a0: number, a1: number, color: string, capStart: boolean, capEnd: boolean): void {
    const ctx = this.ctx;
    const w = ctx.lineWidth;
    ctx.lineCap = 'butt';
    this.strokeArc(r, a0, a1, color);
    ctx.fillStyle = color;
    for (const [cap, a] of [
      [capStart, a0],
      [capEnd, a1],
    ] as [boolean, number][]) {
      if (!cap) continue;
      ctx.beginPath();
      ctx.arc(this.cx + Math.cos(a) * r, this.cy + Math.sin(a) * r, w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private gradientFill(colors: string[]): CanvasGradient {
    const ctx = this.ctx;
    const span = this.arc.end - this.arc.start;
    const g = ctx.createConicGradient(this.arc.start, this.cx, this.cy);
    const frac = Math.min(1, span / (Math.PI * 2));
    colors.forEach((c, i) => g.addColorStop((i / (colors.length - 1)) * frac * 0.9999, c));
    if (frac < 1) g.addColorStop(Math.min(1, frac + 0.001), colors[colors.length - 1]);
    return g;
  }

  private drawTicks(): void {
    const o = this.opts.ticks ?? {};
    if (o.show === false) return;
    const ctx = this.ctx;
    const R = this.radius;
    const th = this.thickness;
    const pos = o.position ?? 'inside';
    const on = pos === 'on';
    const inside = pos === 'inside' || on;
    const majors = gaugeTicks(this.min, this.max, o.major ?? 6);
    const minor = o.minor ?? 4;
    const color = o.color ?? (on ? '#ffffff' : this.theme.muted);
    // 'on': ticks start at the outer edge and cross the colored band
    const base = on ? R : inside ? R - th - 4 : R + 4;
    const dir = inside ? -1 : 1;
    const majorLen = on ? th : Math.max(6, R * 0.075);
    const minorLen = on ? th * 0.35 : Math.max(3, R * 0.035);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'butt';
    // minor
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    for (let i = 0; i < majors.length - 1; i++) {
      for (let k = 1; k <= minor; k++) {
        const v = majors[i] + ((majors[i + 1] - majors[i]) * k) / (minor + 1);
        const a = valueToAngle(v, this.min, this.max, this.arc);
        this.tickLine(a, base, base + dir * minorLen);
      }
    }
    ctx.stroke();
    // major
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const v of majors) this.tickLine(valueToAngle(v, this.min, this.max, this.arc), base, base + dir * majorLen);
    ctx.stroke();
    // labels
    if (o.labels ?? true) {
      const size = clamp(R * 0.085, 9, 14);
      ctx.font = `${size}px ${this.theme.font}`;
      ctx.fillStyle = on ? (o.color ?? this.theme.muted) : color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lr = base + dir * (majorLen + size * 1.1);
      const fmt = o.format ?? ((v: number) => formatCompact(v));
      majors.forEach((v, i) => {
        if (this.full && i === majors.length - 1) return; // same spot as the first
        const a = valueToAngle(v, this.min, this.max, this.arc);
        ctx.fillText(fmt(v), this.cx + Math.cos(a) * lr, this.cy + Math.sin(a) * lr);
      });
    }
    ctx.restore();
  }

  private tickLine(a: number, r0: number, r1: number): void {
    const c = Math.cos(a);
    const s = Math.sin(a);
    this.ctx.moveTo(this.cx + c * r0, this.cy + s * r0);
    this.ctx.lineTo(this.cx + c * r1, this.cy + s * r1);
  }

  private drawMarkers(): void {
    const ctx = this.ctx;
    const R = this.radius;
    ctx.save();
    ctx.font = `600 ${clamp(R * 0.075, 9, 12)}px ${this.theme.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const m of this.opts.markers ?? []) {
      const a = valueToAngle(m.value, this.min, this.max, this.arc);
      const color = m.color ?? this.theme.text;
      const r0 = R + 2;
      const size = Math.max(5, R * 0.05) * (this.hovered === m ? 1.4 : 1);
      // triangle pointing at the arc
      const c = Math.cos(a);
      const s = Math.sin(a);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(this.cx + c * r0, this.cy + s * r0);
      ctx.lineTo(this.cx + c * (r0 + size * 1.6) - s * size, this.cy + s * (r0 + size * 1.6) + c * size);
      ctx.lineTo(this.cx + c * (r0 + size * 1.6) + s * size, this.cy + s * (r0 + size * 1.6) - c * size);
      ctx.closePath();
      ctx.fill();
      // line across the arc
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      this.tickLine(a, R - this.thickness, R);
      ctx.stroke();
      if (m.label) {
        const lr = r0 + size * 1.6 + 10;
        ctx.fillText(m.label, this.cx + c * lr, this.cy + s * lr);
      }
    }
    ctx.restore();
  }

  private needleOpts(): { show: boolean; shape: 'classic' | 'line' | 'arrow'; color: string; width: number; length: number; hub: boolean } {
    const n = this.opts.needle;
    const obj = typeof n === 'object' ? n : {};
    const defShow = n === undefined ? true : n !== false;
    return {
      show: obj.show ?? defShow,
      shape: obj.shape ?? 'classic',
      // 'zone': the color of the zone under the needle
      color: obj.color === 'zone' ? (zoneAt(this.shown, this.opts.zones)?.color ?? this.theme.needle) : (obj.color ?? this.theme.needle),
      width: obj.width ?? Math.max(3, this.radius * 0.045),
      length: obj.length ?? 0.82,
      hub: obj.hub ?? true,
    };
  }

  private drawNeedle(a: number, n: ReturnType<GaugeChart['needleOpts']>): void {
    const ctx = this.ctx;
    const len = this.radius * n.length;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const w = n.width;
    ctx.save();
    ctx.fillStyle = n.color;
    ctx.strokeStyle = n.color;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    const tipX = this.cx + c * len;
    const tipY = this.cy + s * len;
    if (n.shape === 'line') {
      ctx.lineWidth = w * 0.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.cx - c * len * 0.12, this.cy - s * len * 0.12);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
    } else if (n.shape === 'arrow') {
      ctx.lineWidth = w * 0.5;
      ctx.beginPath();
      ctx.moveTo(this.cx, this.cy);
      ctx.lineTo(this.cx + c * (len - w * 2.5), this.cy + s * (len - w * 2.5));
      ctx.stroke();
      const bx = this.cx + c * (len - w * 3);
      const by = this.cy + s * (len - w * 3);
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(bx - s * w * 1.3, by + c * w * 1.3);
      ctx.lineTo(bx + s * w * 1.3, by - c * w * 1.3);
      ctx.closePath();
      ctx.fill();
    } else {
      // classic: tapered from the hub to a sharp tip, with a short tail
      const tail = len * 0.16;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(this.cx - s * w, this.cy + c * w);
      ctx.lineTo(this.cx - c * tail - s * w * 0.5, this.cy - s * tail + c * w * 0.5);
      ctx.lineTo(this.cx - c * tail + s * w * 0.5, this.cy - s * tail - c * w * 0.5);
      ctx.lineTo(this.cx + s * w, this.cy - c * w);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (n.hub) {
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, w * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.theme.background === 'transparent' ? 'rgba(0,0,0,0.35)' : this.theme.background;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, w * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawText(): void {
    const ctx = this.ctx;
    const o = this.opts;
    const t = this.theme;
    const R = this.radius;
    if (o.pointers?.length) {
      this.drawPointerValues();
      return;
    }
    const needle = this.needleOpts().show;
    const zone = zoneAt(this.shown, o.zones);
    const valueColor = (o.valueColorByZone ?? true) && zone ? zone.color : t.text;
    const size = o.valueSize === undefined || o.valueSize === 'auto' ? clamp(R * (needle ? 0.24 : 0.32), 14, 64) : o.valueSize;
    // where the text goes: under the hub for dials with a needle, centered otherwise
    const span = this.arc.end - this.arc.start;
    let y: number;
    if (this.textBelowHub) y = this.cy + this.needleOpts().width * 1.8 + size * 0.75;
    else if (this.full || !needle) y = this.cy + (span <= Math.PI + 1e-6 && !this.full ? -size * 0.45 : 0);
    else y = this.cy + R * 0.42;
    const text = this.fmt(this.shown);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${size}px ${t.font}`;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = valueColor;
    if (o.unit) {
      ctx.font = `600 ${size * 0.42}px ${t.font}`;
      const uw = ctx.measureText(o.unit).width + size * 0.15;
      ctx.font = `700 ${size}px ${t.font}`;
      ctx.fillText(text, this.cx - uw / 2, y);
      ctx.font = `600 ${size * 0.42}px ${t.font}`;
      ctx.fillStyle = t.muted;
      ctx.textAlign = 'left';
      ctx.fillText(o.unit, this.cx - uw / 2 + tw / 2 + size * 0.15, y + size * 0.12);
    } else ctx.fillText(text, this.cx, y);
    ctx.textAlign = 'center';
    if (o.title) {
      ctx.font = `500 ${clamp(size * 0.36, 11, 18)}px ${t.font}`;
      ctx.fillStyle = t.muted;
      ctx.fillText(o.title, this.cx, y + size * 0.78);
    }
    // min / max under the ends of open dials
    const showMinMax = o.showMinMax ?? (!this.full && o.ticks?.labels === false);
    if (showMinMax) {
      ctx.font = `${clamp(R * 0.08, 10, 13)}px ${t.font}`;
      ctx.fillStyle = t.muted;
      const rm = R - this.thickness / 2;
      const fmt = o.ticks?.format ?? ((v: number) => formatCompact(v));
      ctx.fillText(fmt(this.min), this.cx + Math.cos(this.arc.start) * rm, this.cy + Math.sin(this.arc.start) * rm + this.thickness / 2 + 12);
      ctx.fillText(fmt(this.max), this.cx + Math.cos(this.arc.end) * rm, this.cy + Math.sin(this.arc.end) * rm + this.thickness / 2 + 12);
    }
    ctx.restore();
  }

  /** labels and values of the pointers in a row under the hub */
  private drawPointerValues(): void {
    const o = this.opts;
    const list = o.pointers!;
    const ctx = this.ctx;
    const R = this.radius;
    const t = this.theme;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (o.title) {
      ctx.font = `600 ${clamp(R * 0.08, 11, 16)}px ${t.font}`;
      ctx.fillStyle = t.muted;
      ctx.fillText(o.title, this.cx, this.cy - R * 0.32);
    }
    if (o.pointerValues !== false) {
      const y = this.textBelowHub ? this.cy + R * 0.18 : this.cy + R * 0.45;
      const span = Math.min(R * 1.5, this.width - 20);
      const step = span / list.length;
      const size = clamp(R * 0.11, 12, 26);
      list.forEach((p, i) => {
        const x = this.cx - span / 2 + step * (i + 0.5);
        const color = p.color ?? t.text;
        if (p.label) {
          ctx.font = `500 ${size * 0.6}px ${t.font}`;
          ctx.fillStyle = t.muted;
          ctx.fillText(p.label, x, y - size * 0.6);
        }
        ctx.font = `700 ${size}px ${t.font}`;
        ctx.fillStyle = color;
        ctx.fillText(`${this.fmt(this.extraShown[i] ?? this.min)}${o.unit ? ' ' + o.unit : ''}`, x, y + size * 0.35);
      });
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ interaction

  private hitTest(x: number, y: number): GaugeZone | GaugeMarker | 'value' | null {
    const dx = x - this.cx;
    const dy = y - this.cy;
    const d = Math.hypot(dx, dy);
    const R = this.radius;
    const angle = Math.atan2(dy, dx);
    for (const m of this.opts.markers ?? []) {
      const a = valueToAngle(m.value, this.min, this.max, this.arc);
      const mx = this.cx + Math.cos(a) * (R + 8);
      const my = this.cy + Math.sin(a) * (R + 8);
      if (Math.hypot(x - mx, y - my) < 12) return m;
    }
    if (d >= R - this.thickness - 4 && d <= R + 4) {
      const v = angleToValue(angle, this.min, this.max, this.arc);
      if (v !== null) return zoneAt(v, this.opts.zones) ?? 'value';
    }
    if (d < R * 0.6) return 'value';
    return null;
  }

  private bind(): void {
    const c = this.canvas;
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const hit = this.hitTest(x, y);
      const hov = hit && hit !== 'value' ? hit : null;
      if (hov !== this.hovered) {
        this.hovered = hov;
        this.draw();
      }
      this.showTooltip(hit, x, y);
    });
    c.addEventListener('pointerleave', () => {
      this.hovered = null;
      this.tooltipEl.classList.remove('is-visible');
      this.draw();
    });
  }

  private showTooltip(hit: GaugeZone | GaugeMarker | 'value' | null, x: number, y: number): void {
    const tt = this.tooltipEl;
    const o = this.opts.tooltip;
    if (o === false || (typeof o === 'object' && o.show === false) || !hit) {
      tt.classList.remove('is-visible');
      return;
    }
    const unit = this.opts.unit ? ` ${this.opts.unit}` : '';
    const zone = zoneAt(this.target, this.opts.zones);
    const hovered = hit === 'value' ? null : hit;
    if (typeof o === 'object' && o.formatter) tt.innerHTML = o.formatter({ value: this.target, zone, hovered });
    else if (hit === 'value' && (this.opts.pointers?.length || this.opts.rings?.length))
      tt.innerHTML = `<div class="gc-tooltip__head">${esc(this.opts.title ?? 'Valores')}</div>${(this.opts.pointers ?? this.opts.rings ?? [])
        .map(
          (p, i) =>
            `<div class="gc-tooltip__row"><span class="gc-tooltip__dot" style="background:${p.color ?? this.theme.text}"></span><span>${esc(p.label ?? `#${i + 1}`)}</span><b>${esc(this.fmt(p.value) + unit)}</b></div>`,
        )
        .join('')}`;
    else if (hit === 'value')
      tt.innerHTML = `<div class="gc-tooltip__head">${esc(this.opts.title ?? 'Valor')}</div><div class="gc-tooltip__row">${
        zone ? `<span class="gc-tooltip__dot" style="background:${zone.color}"></span>` : ''
      }<span>${esc(zone?.label ?? 'Atual')}</span><b>${esc(this.fmt(this.target) + unit)}</b></div>`;
    else if ('from' in hit)
      tt.innerHTML = `<div class="gc-tooltip__row"><span class="gc-tooltip__dot" style="background:${hit.color}"></span><span>${esc(hit.label ?? 'Zona')}</span><b>${esc(
        `${this.fmt(Math.min(hit.from, hit.to))} – ${this.fmt(Math.max(hit.from, hit.to))}${unit}`,
      )}</b></div>`;
    else
      tt.innerHTML = `<div class="gc-tooltip__row"><span class="gc-tooltip__dot" style="background:${hit.color ?? this.theme.text}"></span><span>${esc(hit.label ?? 'Marcador')}</span><b>${esc(
        this.fmt(hit.value) + unit,
      )}</b></div>`;
    tt.classList.add('is-visible');
    const w = tt.offsetWidth;
    const h = tt.offsetHeight;
    let left = x + 14;
    let top = y + 14;
    if (left + w > this.width - 4) left = x - w - 14;
    if (top + h > this.height - 4) top = y - h - 14;
    tt.style.transform = `translate(${Math.max(4, left)}px, ${Math.max(4, top)}px)`;
  }
}

export function createGauge(container: HTMLElement, options: GaugeOptions = {}): GaugeChart {
  return new GaugeChart(container, options);
}
