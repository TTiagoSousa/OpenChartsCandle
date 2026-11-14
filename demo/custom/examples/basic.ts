import { createCustomChart, type CustomElement, type CustomRenderItem } from 'openchartscandle/custom';
import { candles, choice, h, withToolbar } from '../data';

type Shape = 'candle' | 'ohlc' | 'range';

// Velas desenhadas com uma série própria (dados inventados): o renderItem devolve a mecha e o corpo de cada
// dia. "Forma" troca o renderItem (velas, barras OHLC ou intervalo com ponto) e as formas com o mesmo id
// transformam-se umas nas outras; "Novos dados" troca os valores com setData() animado.
// A roda do rato faz zoom nos dias, arrastar move, duplo clique repõe. Clica num dia.
export function mount(el: HTMLElement): () => void {
  let seed = 21;
  let shape: Shape = 'candle';
  const info = h('span', { class: 'ex-label', text: 'Clica num dia.' });
  const up = '#089981';
  const down = '#f23645';
  const render: CustomRenderItem = (p, api) => {
    const [o, c, lo, hi] = [1, 2, 3, 4].map((d) => Number(api.value(d)));
    const x = api.coord([api.value(0), 0])[0];
    const yo = api.coord([api.value(0), o])[1];
    const yc = api.coord([api.value(0), c])[1];
    const yl = api.coord([api.value(0), lo])[1];
    const yh = api.coord([api.value(0), hi])[1];
    const w = Math.max(2, api.size([1, 0])[0] * 0.62);
    const color = c >= o ? up : down;
    const i = p.dataIndex;
    const children: CustomElement[] = [{ type: 'line', id: `w${i}`, shape: { x1: x, y1: yh, x2: x, y2: yl }, style: { stroke: color, lineWidth: shape === 'range' ? 2 : 1.2 } }];
    if (shape === 'candle')
      children.push({ type: 'rect', id: `b${i}`, shape: { x: x - w / 2, y: Math.min(yo, yc), width: w, height: Math.max(1, Math.abs(yc - yo)) }, style: { fill: color } });
    else if (shape === 'ohlc')
      children.push({ type: 'polyline', id: `b${i}`, shape: { points: [[x - w / 2, yo], [x, yo], [x, yc], [x + w / 2, yc]] }, style: { stroke: color, lineWidth: 2 } });
    else children.push({ type: 'circle', id: `b${i}`, shape: { cx: x, cy: yc, r: Math.min(5, w / 2) }, style: { fill: color, stroke: '#131722', lineWidth: 1 } });
    return { type: 'group', children };
  };
  const host = withToolbar(
    el,
    choice<Shape>(
      'Forma',
      [
        ['Velas', 'candle'],
        ['OHLC', 'ohlc'],
        ['Intervalo', 'range'],
      ],
      shape,
      (s) => {
        shape = s;
        chart.refresh(true);
      },
    ),
    h('button', { class: 'ex-btn', text: 'Novos dados', onclick: () => chart.setData(candles(30, ++seed)) }),
    info,
  );
  const chart = createCustomChart(host, {
    title: { text: 'ACME · diário', subtext: 'Série própria: cada vela é desenhada pelo renderItem' },
    xAxis: { type: 'category' },
    yAxis: { beginAtZero: false, opposite: true },
    zoom: { axis: 'x', minSpan: 5 },
    series: [
      {
        name: 'ACME',
        data: candles(30, seed),
        dimensions: ['Dia', 'Abertura', 'Fecho', 'Mínimo', 'Máximo'],
        encode: { x: 0, y: [3, 4], itemName: 0, tooltip: [1, 4, 3, 2] },
        renderItem: render,
      },
    ],
    valueFormatter: (v) => v.toFixed(2),
  });
  chart.on('click', (p) => {
    const [d, o, c] = p.value as [string, number, number];
    info.textContent = `${d}: ${o.toFixed(2)} → ${c.toFixed(2)} (${(((c - o) / o) * 100).toFixed(2)}%)`;
  });
  return () => chart.destroy();
}
