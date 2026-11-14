import { createCustomChart } from 'openchartscandle/custom';
import { flameTree, type FlameNode } from '../data';

// Flame graph do perfil de CPU de um backtest: cada função é um retângulo com a largura do tempo que ocupou,
// por cima de quem a chamou. Clica numa função para fazer zoom nela (animado); duplo clique volta ao início.
export function mount(el: HTMLElement): () => void {
  const rows: [number, number, number, string, number][] = [];
  const walk = (n: FlameNode, depth: number, start: number): void => {
    rows.push([depth, start, start + n.value, n.name, n.value]);
    let x = start;
    for (const c of n.children ?? []) {
      walk(c, depth + 1, x);
      x += c.value;
    }
  };
  const root = flameTree();
  walk(root, 0, 0);
  const depth = Math.max(...rows.map((r) => r[0])) + 1;
  const hue = (s: string): string => {
    let h = 0;
    for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 997;
    return `hsl(${10 + (h % 40)}, ${70 + (h % 20)}%, ${48 + (h % 12)}%)`;
  };
  const chart = createCustomChart(el, {
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: { show: false, min: 0, max: root.value },
    yAxis: { show: false, min: 0, max: depth },
    zoom: { axis: 'x', minSpan: 10 },
    series: [
      {
        name: 'CPU',
        data: rows,
        dimensions: ['Nível', 'Início', 'Fim', 'Função', 'Tempo (ms)'],
        encode: { x: [1, 2], y: 0, itemName: 3, tooltip: [4] },
        renderItem: (p, api) => {
          const [x0, y0] = api.coord([api.value(1), api.value(0)]);
          const [x1, y1] = api.coord([api.value(2), Number(api.value(0)) + 1]);
          return {
            type: 'rect',
            id: `n${p.dataIndex}`,
            shape: { x: x0 + 0.5, y: y1 + 0.5, width: Math.max(0, x1 - x0 - 1), height: y0 - y1 - 1, r: 2 },
            style: { fill: hue(String(api.value(3))) },
            label: { text: api.value(3), position: 'insideLeft', fontSize: 11, color: '#1b1b1b' },
          };
        },
      },
    ],
    animation: { duration: 500 },
  });
  const off = chart.on('click', (e) => chart.zoomTo('x', e.value[1], e.value[2]));
  return () => {
    off();
    chart.destroy();
  };
}
