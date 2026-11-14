import { clamp } from './utils';

export class TimeScale {
  width = 0;
  barSpacing = 8;
  rightOffset = 8;
  baseIndex = 0;
  readonly minSpacing = 0.5;
  readonly maxSpacing = 80;

  indexToX(i: number): number {
    return this.width - (this.baseIndex + this.rightOffset - i) * this.barSpacing - this.barSpacing * 0.5;
  }

  xToIndex(x: number): number {
    return this.baseIndex + this.rightOffset - (this.width - x - this.barSpacing * 0.5) / this.barSpacing;
  }

  setBarSpacing(s: number): void {
    this.barSpacing = clamp(s, this.minSpacing, this.maxSpacing);
  }

  /** Zoom keeping the bar under `x` fixed (same maths as lightweight-charts). */
  zoom(x: number, scale: number): void {
    const before = this.xToIndex(x);
    this.setBarSpacing(this.barSpacing + scale * (this.barSpacing / 10));
    this.rightOffset += before - this.xToIndex(x);
    this.constrain();
  }

  constrain(): void {
    const visibleBars = this.width / this.barSpacing;
    const maxRO = Math.max(visibleBars - 3, 0);
    const minRO = -this.baseIndex + 3 - visibleBars;
    this.rightOffset = clamp(this.rightOffset, Math.min(minRO, maxRO), maxRO);
  }

  visibleRange(): { from: number; to: number } {
    return { from: Math.floor(this.xToIndex(0)), to: Math.ceil(this.xToIndex(this.width)) };
  }
}

export class PriceScale {
  height = 0;
  min = 0;
  max = 1;
  auto = true;
  log = false;
  invert = false;
  marginTop = 0.1;
  marginBottom = 0.1;

  private tr(p: number): number {
    return this.log ? Math.log10(Math.max(p, 1e-12)) : p;
  }

  private itr(v: number): number {
    return this.log ? Math.pow(10, v) : v;
  }

  private get innerTop(): number {
    return this.height * this.marginTop;
  }

  private get inner(): number {
    return Math.max(1, this.height * (1 - this.marginTop - this.marginBottom));
  }

  setRange(lo: number, hi: number): void {
    if (!isFinite(lo) || !isFinite(hi)) return;
    if (hi - lo < Math.abs(hi) * 1e-9 || hi === lo) {
      const d = Math.abs(hi) * 0.01 || 1;
      lo -= d;
      hi += d;
    }
    if (this.log && lo <= 0) lo = hi / 100;
    this.min = lo;
    this.max = hi;
  }

  priceToY(p: number): number {
    const a = this.tr(this.min);
    const b = this.tr(this.max);
    let r = (this.tr(p) - a) / (b - a);
    if (this.invert) r = 1 - r;
    return this.innerTop + (1 - r) * this.inner;
  }

  yToPrice(y: number): number {
    const a = this.tr(this.min);
    const b = this.tr(this.max);
    let r = 1 - (y - this.innerTop) / this.inner;
    if (this.invert) r = 1 - r;
    return this.itr(a + r * (b - a));
  }

  /** Scale range around its center in transformed space. */
  scaleFrom(startMin: number, startMax: number, factor: number): void {
    const a = this.tr(startMin);
    const b = this.tr(startMax);
    const c = (a + b) / 2;
    const h = ((b - a) / 2) * factor;
    this.min = this.itr(c - h);
    this.max = this.itr(c + h);
  }

  panFrom(startMin: number, startMax: number, dy: number): void {
    const a = this.tr(startMin);
    const b = this.tr(startMax);
    const d = ((b - a) / this.inner) * dy * (this.invert ? -1 : 1);
    this.min = this.itr(a + d);
    this.max = this.itr(b + d);
  }
}

/** Kinetic scroll — port of lightweight-charts' KineticAnimation. */
export class Kinetic {
  private positions: { time: number; position: number }[] = [];
  private startPos: { time: number; position: number } | null = null;
  private speed = 0;
  private duration = 0;

  constructor(
    private minSpeed = 0.2,
    private maxSpeed = 7,
    private damping = 0.997,
    private minMove = 15,
  ) {}

  reset(): void {
    this.positions = [];
    this.startPos = null;
  }

  addPosition(position: number, time: number): void {
    const p1 = this.positions[0];
    if (p1) {
      if (p1.time === time) {
        p1.position = position;
        return;
      }
      if (Math.abs(p1.position - position) < this.minMove) return;
    }
    this.positions.unshift({ time, position });
    if (this.positions.length > 4) this.positions.length = 4;
  }

  start(position: number, time: number): boolean {
    const ps = this.positions;
    if (ps.length < 2 || time - ps[0].time > 50) return false;
    const speedOf = (a: { time: number; position: number }, b: { time: number; position: number }): number => {
      const s = (a.position - b.position) / (a.time - b.time);
      return Math.sign(s) * Math.min(Math.abs(s), this.maxSpeed);
    };
    const s1 = speedOf(ps[0], ps[1]);
    const speeds = [s1];
    const dists = [ps[0].position - ps[1].position];
    for (let i = 1; i < ps.length - 1; i++) {
      const s = speedOf(ps[i], ps[i + 1]);
      if (Math.sign(s) !== Math.sign(s1)) break;
      speeds.push(s);
      dists.push(ps[i].position - ps[i + 1].position);
    }
    const total = dists.reduce((a, b) => a + b, 0);
    let speed = 0;
    for (let i = 0; i < speeds.length; i++) speed += (dists[i] / total) * speeds[i];
    if (!isFinite(speed) || Math.abs(speed) < this.minSpeed) return false;
    const ln = Math.log(this.damping);
    this.startPos = { time, position };
    this.speed = speed;
    this.duration = Math.log((1 * ln) / -Math.abs(speed)) / ln;
    return true;
  }

  position(time: number): number {
    const sp = this.startPos!;
    const dt = Math.min(time - sp.time, this.duration);
    return sp.position + (this.speed * (Math.pow(this.damping, dt) - 1)) / Math.log(this.damping);
  }

  finished(time: number): boolean {
    return this.startPos === null || time - this.startPos.time >= this.duration;
  }
}
