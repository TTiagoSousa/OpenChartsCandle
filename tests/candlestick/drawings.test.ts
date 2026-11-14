import { describe, expect, it } from 'vitest';
import type { SerializedDrawing } from '../../src/candlestick/drawings/base';
import { DrawingManager, DrawingStorage } from '../../src/candlestick/drawings/manager';
import { toolById } from '../../src/candlestick/drawings/registry';

function memoryStorage(): DrawingStorage & { data: Record<string, SerializedDrawing[]> } {
  const data: Record<string, SerializedDrawing[]> = {};
  return { data, load: (s) => data[s] ?? [], save: (s, d) => (data[s] = JSON.parse(JSON.stringify(d))) };
}

const fib = (): SerializedDrawing => {
  const d = toolById('fib')!.create();
  d.points = [{ time: 0, price: 100 }, { time: 600, price: 120 }];
  return d.toJSON();
};

describe('DrawingManager', () => {
  it('persists per symbol through the storage adapter', () => {
    const storage = memoryStorage();
    const dm = new DrawingManager(() => {}, storage);
    dm.load('AAA');
    dm.fromJSON([fib()]);
    expect(storage.data.AAA).toHaveLength(1);
    dm.load('BBB');
    expect(dm.drawings).toHaveLength(0);
    dm.load('AAA');
    expect(dm.drawings[0].type).toBe('fib');
  });

  it('undo / redo restores removed drawings', () => {
    const dm = new DrawingManager(() => {}, null);
    dm.load('X');
    dm.fromJSON([fib(), fib()]);
    dm.remove(dm.drawings[0]);
    expect(dm.drawings).toHaveLength(1);
    dm.undo();
    expect(dm.drawings).toHaveLength(2);
    dm.redo();
    expect(dm.drawings).toHaveLength(1);
  });

  it('add() creates a drawing from code (ms timestamps accepted) and is undoable', () => {
    const dm = new DrawingManager(() => {}, null);
    dm.load('Y');
    const d = dm.add('hline', [{ time: 1_760_000_000_000, price: 42 }], { color: '#ff0000' });
    expect(d?.type).toBe('hline');
    expect(d?.points[0].time).toBe(1_760_000_000);
    expect(d?.opts.color).toBe('#ff0000');
    expect(dm.add('nao-existe', [])).toBeNull();
    dm.undo();
    expect(dm.drawings).toHaveLength(0);
  });
});
