import { describe, expect, it } from 'vitest';
import { PriceScale, TimeScale } from '../../src/candlestick/core/scales';

describe('TimeScale', () => {
  it('index <-> x round trip', () => {
    const ts = new TimeScale();
    ts.width = 1000;
    ts.baseIndex = 500;
    ts.barSpacing = 7;
    ts.rightOffset = 10;
    for (const i of [0, 123.5, 500, 510]) expect(ts.xToIndex(ts.indexToX(i))).toBeCloseTo(i);
  });

  it('zoom keeps the bar under the cursor fixed', () => {
    const ts = new TimeScale();
    ts.width = 1000;
    ts.baseIndex = 5000;
    const before = ts.xToIndex(400);
    ts.zoom(400, 1);
    expect(ts.barSpacing).toBeGreaterThan(8);
    expect(ts.xToIndex(400)).toBeCloseTo(before);
  });
});

describe('PriceScale', () => {
  it('price <-> y round trip in linear and log mode', () => {
    for (const log of [false, true]) {
      const ps = new PriceScale();
      ps.height = 600;
      ps.log = log;
      ps.setRange(100, 200);
      expect(ps.priceToY(200)).toBeCloseTo(60); // 10% top margin
      for (const p of [100, 133.3, 200]) expect(ps.yToPrice(ps.priceToY(p))).toBeCloseTo(p);
    }
  });
});
