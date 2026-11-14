import { theme } from '../core/theme';
import type { Point } from '../core/types';
import { Emitter, storageGet, storageSet } from '../core/utils';
import type { PaneView } from '../core/view';
import { AxisMarks, Drawing, DrawingOptions, HitResult, SerializedDrawing, drawHandles } from './base';
import { deserializeDrawing, toolById } from './registry';

export type MagnetMode = 'off' | 'weak' | 'strong';

/** Persistence for drawings, one list per symbol. */
export interface DrawingStorage {
  load(symbol: string): SerializedDrawing[];
  save(symbol: string, drawings: SerializedDrawing[]): void;
}

/** Default storage: browser localStorage under `${prefix}.drawings.${symbol}`. */
export function localDrawingStorage(prefix = 'openchartscandle'): DrawingStorage {
  return {
    load: (symbol) => storageGet<SerializedDrawing[]>(`${prefix}.drawings.${symbol}`, []),
    save: (symbol, drawings) => storageSet(`${prefix}.drawings.${symbol}`, drawings),
  };
}

export interface Mods {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
}

interface CreationState {
  d: Drawing;
  step: number;
  downX: number;
  downY: number;
  pressed: boolean;
  dragged: boolean;
  freehand: boolean;
  before: string;
}

interface DragState {
  d: Drawing;
  kind: 'handle' | 'move';
  index: number;
  startX: number;
  startY: number;
  orig: Point[];
  before: string;
  changed: boolean;
}

export class DrawingManager {
  drawings: Drawing[] = [];
  tool: string | null = null;
  magnet: MagnetMode = 'off';
  stayInDrawMode = false;
  hideAll = false;
  lockAll = false;
  selected: Drawing | null = null;
  hovered: Drawing | null = null;
  hoverHit: HitResult | null = null;
  creating: CreationState | null = null;
  drag: DragState | null = null;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private symbol = '';
  private clipboard: SerializedDrawing | null = null;
  toolDefaults: Record<string, Partial<DrawingOptions>> = storageGet('openchartscandle.toolDefaults', {});

  readonly changed = new Emitter<void>();
  readonly selection = new Emitter<Drawing | null>();
  readonly toolChanged = new Emitter<string | null>();
  readonly textEdit = new Emitter<Drawing>();
  readonly historyChanged = new Emitter<void>();

  constructor(private requestRender: () => void, private storage: DrawingStorage | null = localDrawingStorage()) {}

  // ---------- persistence ----------

  load(symbol: string): void {
    this.cancelCreation();
    this.symbol = symbol;
    const raw = this.storage?.load(symbol) ?? [];
    this.drawings = raw.map(deserializeDrawing).filter((d): d is Drawing => !!d);
    this.selected = null;
    this.hovered = null;
    this.undoStack = [];
    this.redoStack = [];
    this.selection.emit(null);
    this.historyChanged.emit();
  }

  save(): void {
    if (!this.symbol || !this.storage) return;
    this.storage.save(this.symbol, this.toJSON());
  }

  /** Serializable snapshot of all drawings (to store in your own backend). */
  toJSON(): SerializedDrawing[] {
    return this.drawings.map((d) => d.toJSON());
  }

  /** Replace all drawings with a serialized list (e.g. loaded from your backend). */
  fromJSON(list: SerializedDrawing[]): void {
    this.cancelCreation();
    this.drawings = list.map(deserializeDrawing).filter((d): d is Drawing => !!d);
    this.selected = null;
    this.hovered = null;
    this.selection.emit(null);
    this.save();
    this.changed.emit();
    this.requestRender();
  }

  private serialize(): string {
    return JSON.stringify(this.drawings.map((d) => d.toJSON()));
  }

  private restore(s: string): void {
    const raw = JSON.parse(s) as SerializedDrawing[];
    const selId = this.selected?.id;
    this.drawings = raw.map(deserializeDrawing).filter((d): d is Drawing => !!d);
    this.selected = this.drawings.find((d) => d.id === selId) ?? null;
    this.hovered = null;
    this.selection.emit(this.selected);
  }

  private pushUndo(before: string): void {
    this.undoStack.push(before);
    if (this.undoStack.length > 200) this.undoStack.shift();
    this.redoStack = [];
    this.historyChanged.emit();
  }

  /** Record current state before an external mutation (style change etc). */
  checkpoint(): void {
    this.pushUndo(this.serialize());
  }

  commit(): void {
    this.save();
    this.changed.emit();
    this.requestRender();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): void {
    if (this.creating) {
      this.cancelCreation();
      return;
    }
    const s = this.undoStack.pop();
    if (s === undefined) return;
    this.redoStack.push(this.serialize());
    this.restore(s);
    this.historyChanged.emit();
    this.commit();
  }

  redo(): void {
    const s = this.redoStack.pop();
    if (s === undefined) return;
    this.undoStack.push(this.serialize());
    this.restore(s);
    this.historyChanged.emit();
    this.commit();
  }

  // ---------- tool / selection ----------

  setTool(id: string | null): void {
    this.cancelCreation();
    this.tool = id;
    if (id) this.select(null);
    this.toolChanged.emit(id);
    this.requestRender();
  }

  select(d: Drawing | null): void {
    if (this.selected === d) return;
    this.selected = d;
    this.selection.emit(d);
    this.requestRender();
  }

  remove(d: Drawing): void {
    const i = this.drawings.indexOf(d);
    if (i < 0) return;
    this.checkpoint();
    this.drawings.splice(i, 1);
    if (this.selected === d) this.select(null);
    if (this.hovered === d) this.hovered = null;
    this.commit();
  }

  deleteSelected(): void {
    if (this.selected) this.remove(this.selected);
  }

  clearAll(): void {
    if (!this.drawings.length) return;
    this.checkpoint();
    this.drawings = [];
    this.select(null);
    this.commit();
  }

  copySelected(): void {
    if (this.selected) this.clipboard = JSON.parse(JSON.stringify(this.selected.toJSON()));
  }

  paste(v: PaneView): void {
    if (!this.clipboard) return;
    const d = deserializeDrawing(this.clipboard);
    if (!d) return;
    this.checkpoint();
    d.id = `${d.id}_c${Date.now()}`;
    const shift = Math.max(3, Math.round(20 / v.ts.barSpacing));
    d.points = d.points.map((p) => ({ time: v.data.indexToTime(v.data.timeToIndex(p.time) + shift), price: p.price }));
    this.clipboard = d.toJSON();
    this.drawings.push(d);
    this.select(d);
    this.commit();
  }

  /**
   * Create a drawing from code, e.g. `add('trendline', [{ time, price }, { time, price }], { color: '#f00' })`.
   * Tool ids are listed in `ALL_TOOLS`. Returns null for unknown ids.
   */
  add(type: string, points: Point[], opts?: Partial<DrawingOptions>): Drawing | null {
    const def = toolById(type);
    if (!def) return null;
    const d = def.create({ ...(this.toolDefaults[type] ?? {}), ...(opts ?? {}) });
    d.points = points.map((p) => ({ time: p.time > 1e11 ? Math.floor(p.time / 1000) : p.time, price: p.price }));
    this.checkpoint();
    this.drawings.push(d);
    this.commit();
    return d;
  }

  clone(d: Drawing): void {
    this.checkpoint();
    const c = d.clone();
    this.drawings.push(c);
    this.select(c);
    this.commit();
  }

  bringToFront(d: Drawing): void {
    this.checkpoint();
    this.drawings = [...this.drawings.filter((x) => x !== d), d];
    this.commit();
  }

  sendToBack(d: Drawing): void {
    this.checkpoint();
    this.drawings = [d, ...this.drawings.filter((x) => x !== d)];
    this.commit();
  }

  /** Apply option change to a drawing, recording undo + remembering as tool default. */
  updateOptions(d: Drawing, patch: Partial<DrawingOptions>, remember = true): void {
    this.checkpoint();
    Object.assign(d.opts, patch);
    if (remember && toolById(d.type)) {
      const keys = ['color', 'width', 'dash', 'fill', 'fillEnabled', 'textColor', 'fontSize'];
      const keep: Partial<DrawingOptions> = { ...(this.toolDefaults[d.type] ?? {}) };
      for (const k of Object.keys(patch)) if (keys.includes(k)) (keep as Record<string, unknown>)[k] = (patch as Record<string, unknown>)[k];
      this.toolDefaults[d.type] = keep;
      storageSet('openchartscandle.toolDefaults', this.toolDefaults);
    }
    this.commit();
  }

  // ---------- snapping ----------

  snap(v: PaneView, x: number, y: number, freeTime = false): Point {
    const fi = v.ts.xToIndex(x);
    const i = Math.round(fi);
    const time = freeTime ? v.data.indexToTime(fi) : v.data.indexToTime(i);
    let price = v.yToPrice(y);
    if (this.magnet !== 'off' && !freeTime) {
      const b = v.bars[i];
      if (b) {
        let best = Infinity;
        let bp = price;
        for (const c of [b.open, b.high, b.low, b.close]) {
          const d = Math.abs(v.priceToY(c) - y);
          if (d < best) {
            best = d;
            bp = c;
          }
        }
        if (this.magnet === 'strong' || best < 32) price = bp;
      }
    }
    return { time, price };
  }

  // ---------- hit testing ----------

  hitTest(v: PaneView, x: number, y: number): { d: Drawing; hit: HitResult } | null {
    if (this.hideAll) return null;
    if (this.selected && !this.selected.hidden) {
      const h = this.selected.hitTest(v, x, y, true);
      if (h && h.kind === 'handle') return { d: this.selected, hit: h };
    }
    for (let i = this.drawings.length - 1; i >= 0; i--) {
      const d = this.drawings[i];
      const h = d.hitTest(v, x, y, d === this.selected || d === this.hovered);
      if (h) return { d, hit: h };
    }
    return null;
  }

  hover(v: PaneView, x: number, y: number): string | null {
    if (this.creating || this.drag || this.tool) {
      return null;
    }
    const r = this.hitTest(v, x, y);
    const prev = this.hovered;
    this.hovered = r?.d ?? null;
    this.hoverHit = r?.hit ?? null;
    if (prev !== this.hovered) this.requestRender();
    if (!r) return null;
    if (this.lockAll || r.d.locked) return 'pointer';
    return r.hit.cursor;
  }

  // ---------- pointer flow ----------

  isBusy(): boolean {
    return !!(this.creating || this.drag);
  }

  pointerDown(v: PaneView, x: number, y: number, m: Mods): boolean {
    if (this.tool) {
      this.createStep(v, x, y, m, true);
      return true;
    }
    const r = this.hitTest(v, x, y);
    if (!r) {
      this.select(null);
      return false;
    }
    this.select(r.d);
    if (this.lockAll || r.d.locked) return true;
    this.drag = {
      d: r.d,
      kind: r.hit.kind === 'handle' ? 'handle' : 'move',
      index: r.hit.index,
      startX: x,
      startY: y,
      orig: r.d.points.map((p) => ({ ...p })),
      before: this.serialize(),
      changed: false,
    };
    return true;
  }

  pointerMove(v: PaneView, x: number, y: number, m: Mods): void {
    const c = this.creating;
    if (c) {
      if (c.freehand) {
        if (!c.pressed) return;
        const last = v.toXY(c.d.points[c.d.points.length - 1]);
        if (Math.hypot(last.x - x, last.y - y) >= 2) c.d.points.push(this.snap(v, x, y, true));
      } else {
        if (c.pressed && Math.hypot(x - c.downX, y - c.downY) > 5) c.dragged = true;
        c.d.setCreationPoint(c.step, this.snap(v, x, y), v, m.shift);
      }
      this.requestRender();
      return;
    }
    const g = this.drag;
    if (!g) return;
    if (!g.changed && Math.hypot(x - g.startX, y - g.startY) < 2) return;
    if (!g.changed) {
      g.changed = true;
      this.pushUndo(g.before);
    }
    if (g.kind === 'handle') {
      g.d.moveHandle(g.index, this.snap(v, x, y), v, m.shift);
    } else {
      const dIdx = Math.round(v.ts.xToIndex(x) - v.ts.xToIndex(g.startX));
      const dy = y - g.startY;
      g.d.points = g.orig.map((p) => ({
        time: v.data.indexToTime(v.data.timeToIndex(p.time) + dIdx),
        price: v.yToPrice(v.priceToY(p.price) + dy),
      }));
    }
    this.requestRender();
  }

  pointerUp(v: PaneView, x: number, y: number, m: Mods): void {
    const c = this.creating;
    if (c) {
      if (c.freehand) {
        this.finishCreation();
        return;
      }
      const wasDrag = c.pressed && c.dragged;
      c.pressed = false;
      c.dragged = false;
      if (wasDrag) this.createStep(v, x, y, m, false);
      return;
    }
    const g = this.drag;
    this.drag = null;
    if (g?.changed) this.commit();
  }

  doubleClick(v: PaneView, x: number, y: number): Drawing | null {
    if (this.creating && this.creating.d.pointsNeeded === -1) {
      const d = this.creating.d;
      // dbl-click produced extra points at the same spot; drop duplicates
      while (d.points.length > 2) {
        const a = v.toXY(d.points[d.points.length - 1]);
        const b = v.toXY(d.points[d.points.length - 2]);
        if (Math.hypot(a.x - b.x, a.y - b.y) < 4) d.points.pop();
        else break;
      }
      this.finishCreation();
      return null;
    }
    const r = this.hitTest(v, x, y);
    return r ? r.d : null;
  }

  private createStep(v: PaneView, x: number, y: number, m: Mods, isDown: boolean): void {
    const c = this.creating;
    if (!c) {
      if (!isDown || !this.tool) return;
      const def = toolById(this.tool);
      if (!def) return;
      const d = def.create(this.toolDefaults[this.tool]);
      const before = this.serialize();
      const N = d.pointsNeeded;
      if (N === 0) {
        d.points = [this.snap(v, x, y, true)];
        this.drawings.push(d);
        this.creating = { d, step: 0, downX: x, downY: y, pressed: true, dragged: false, freehand: true, before };
        this.requestRender();
        return;
      }
      const p = this.snap(v, x, y);
      d.points = [p];
      if (N === 1) {
        d.setCreationPoint(0, p, v, m.shift);
        d.init(v);
        this.drawings.push(d);
        this.creating = { d, step: 0, downX: x, downY: y, pressed: false, dragged: false, freehand: false, before };
        this.finishCreation();
        if (d.type === 'text') this.textEdit.emit(d);
        return;
      }
      d.points.push({ ...p });
      this.drawings.push(d);
      this.creating = { d, step: 1, downX: x, downY: y, pressed: true, dragged: false, freehand: false, before };
      this.requestRender();
      return;
    }
    if (isDown) {
      c.pressed = true;
      c.dragged = false;
      c.downX = x;
      c.downY = y;
    }
    const d = c.d;
    const p = this.snap(v, x, y);
    d.setCreationPoint(c.step, p, v, m.shift);
    const N = d.pointsNeeded;
    if (N === -1 || c.step < N - 1) {
      c.step++;
      d.points.push({ ...d.points[d.points.length - 1] });
      d.setCreationPoint(c.step, p, v, m.shift);
    } else {
      this.finishCreation();
    }
    this.requestRender();
  }

  finishCreation(): void {
    const c = this.creating;
    if (!c) return;
    this.creating = null;
    const d = c.d;
    if (d.pointsNeeded === -1 && d.points.length > 2) d.points.pop(); // remove rubber-band point
    const valid = d.pointsNeeded === 1 || d.points.length >= 2;
    if (!valid) {
      this.drawings = this.drawings.filter((x) => x !== d);
    } else {
      this.pushUndo(c.before);
      this.select(d);
    }
    if (!this.stayInDrawMode) {
      this.tool = null;
      this.toolChanged.emit(null);
    }
    this.commit();
  }

  cancelCreation(): void {
    const c = this.creating;
    if (!c) return;
    this.creating = null;
    if (c.d.pointsNeeded === -1 && c.d.points.length > 2) {
      this.creating = c;
      this.finishCreation();
      return;
    }
    this.drawings = this.drawings.filter((x) => x !== c.d);
    this.requestRender();
  }

  // ---------- rendering ----------

  draw(v: PaneView): void {
    if (this.hideAll && !this.creating) return;
    const ctx = v.ctx;
    for (const d of this.drawings) {
      if (d.hidden) continue;
      const selected = d === this.selected;
      const hovered = d === this.hovered;
      const creating = this.creating?.d === d;
      ctx.save();
      d.draw(v, { selected, hovered, creating });
      ctx.restore();
    }
    const showHandlesFor = new Set<Drawing>();
    if (this.selected && !this.selected.hidden) showHandlesFor.add(this.selected);
    if (this.hovered && !this.hovered.hidden && !this.drag) showHandlesFor.add(this.hovered);
    if (this.creating) showHandlesFor.add(this.creating.d);
    for (const d of showHandlesFor) {
      const locked = d.locked || this.lockAll;
      drawHandles(ctx, d.handles(v), locked ? theme.muted : theme.accent);
    }
  }

  /** Axis highlights for the active drawing + persistent price labels (e.g. horizontal lines). */
  axisMarks(v: PaneView): { active: AxisMarks | null; persistent: { price: number; color: string }[]; persistentTimes: { time: number; color: string }[] } {
    const persistent: { price: number; color: string }[] = [];
    const persistentTimes: { time: number; color: string }[] = [];
    if (!this.hideAll) {
      for (const d of this.drawings) {
        if (d.hidden || d.points.length === 0) continue;
        const m = d.axisMarks(v);
        if (d.type === 'hline' || d.type === 'hray' || d.type === 'crossline') {
          for (const p of m.prices) if (p.persistent) persistent.push({ price: p.price, color: p.color ?? d.opts.color });
        }
        if (d.type === 'vline' || d.type === 'crossline') persistentTimes.push({ time: d.points[0].time, color: d.opts.color });
      }
    }
    const act = this.creating?.d ?? this.drag?.d ?? this.selected ?? null;
    return { active: act && !act.hidden && act.points.length ? act.axisMarks(v) : null, persistent, persistentTimes };
  }
}
