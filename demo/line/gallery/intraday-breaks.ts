import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Gráfico intradiário com quebras no eixo: só as horas de negociação ocupam espaço.
// A pausa de almoço (11:30–13:00) fica escondida (xAxis.breaks) e marcada com um tracejado.
const day = Date.UTC(2026, 9, 14) / 1000;
const at = (h: number, m: number): number => day + h * 3600 + m * 60;

function session(from: number, to: number, start: number, seed: number): LinePoint[] {
  let s = seed;
  const rand = (): number => ((s = (s * 16807) % 2147483647) / 2147483647);
  let v = start;
  const out: LinePoint[] = [];
  for (let t = from; t <= to; t += 60) {
    v += (rand() - 0.5) * 0.12;
    out.push({ x: t, y: +v.toFixed(2) });
  }
  return out;
}

export function mount(el: HTMLElement): () => void {
  const morning = session(at(9, 30), at(11, 30), 32.4, 4);
  const afternoon = session(at(13, 0), at(15, 0), morning[morning.length - 1].y as number, 8);
  const chart = createLineChart(el, {
    series: [{ name: 'Preço', data: [...morning, ...afternoon], width: 1.5, area: { opacity: 0.15 } }],
    xAxis: { breaks: [{ from: at(11, 30), to: at(13, 0) }] },
    legend: { show: false },
    zoom: true,
    valueFormatter: (v) => v.toFixed(2),
  });
  return () => chart.destroy();
}
