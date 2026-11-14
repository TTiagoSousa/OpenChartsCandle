import { createGraphChart, type GraphLink, type GraphNode } from 'openchartscandle/graph';
import { seeded } from '../data';

// Um grafo sobre um calendário: algumas reuniões de janeiro a abril de 2026 ligadas às seguintes por curvas.
// O calendário (uma coluna por semana, uma linha por dia da semana) é desenhado pelo próprio grafo no
// `underlay`: cada dia é a caixa (coluna, dia) nas coordenadas dos nós. Dados gerados.
const MONTHS = ['jan', 'fev', 'mar', 'abr'];
const WEEKDAYS = ['Seg', '', 'Qua', '', 'Sex', '', 'Dom'];

export function mount(el: HTMLElement): () => void {
  const rnd = seeded(5);
  // every day: its week column, weekday row and a value
  const start = new Date(2026, 0, 1);
  const offset = (start.getDay() + 6) % 7;
  const days: { date: Date; col: number; row: number; v: number }[] = [];
  for (let d = new Date(start); d < new Date(2026, 4, 1); d.setDate(d.getDate() + 1)) {
    const i = Math.round((d.getTime() - start.getTime()) / 864e5) + offset;
    days.push({ date: new Date(d), col: Math.floor(i / 7), row: i % 7, v: rnd() });
  }
  const cols = days[days.length - 1].col + 1;
  const meetings = days.filter((d) => d.row < 5 && rnd() < 0.22);
  const nodes: GraphNode[] = meetings.map((d, i) => ({ id: `r${i}`, name: `Reunião ${i + 1}`, x: d.col + 0.5, y: d.row + 0.5, value: Math.round(2 + rnd() * 10), category: d.date.getMonth() }));
  const links: GraphLink[] = [];
  nodes.forEach((n, i) => {
    for (const j of [i + 1, i + 2 + Math.floor(rnd() * 3)]) if (nodes[j]) links.push({ source: n.id, target: nodes[j].id, curveness: 0.3 });
  });
  const when = new Map(meetings.map((d, i) => [`r${i}`, d.date]));
  const chart = createGraphChart(el, {
    nodes,
    links,
    categories: MONTHS.map((m) => m[0].toUpperCase() + m.slice(1)),
    colors: ['#ff9800', '#f23645', '#2962ff', '#089981'],
    layout: 'none',
    extent: [-1.4, -1.2, cols + 0.2, 7.2],
    symbolSize: [8, 18],
    edge: { color: 'rgba(255, 152, 0, 0.5)', width: 1.2 },
    roam: false,
    draggable: false,
    underlay: (ctx, api) => {
      const box = (x0: number, y0: number, x1: number, y1: number): [number, number, number, number] => {
        const a = api.toPixel(x0, y0);
        const b = api.toPixel(x1, y1);
        return [a.x, a.y, b.x - a.x, b.y - a.y];
      };
      for (const d of days) {
        const [x, y, w, h] = box(d.col + 0.06, d.row + 0.06, d.col + 0.94, d.row + 0.94);
        ctx.fillStyle = `rgba(41, 98, 255, ${0.08 + d.v * 0.22})`;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 2);
        ctx.fill();
      }
      ctx.font = `11px ${api.theme.font}`;
      ctx.fillStyle = api.theme.muted;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      WEEKDAYS.forEach((name, r) => {
        const p = api.toPixel(-0.2, r + 0.5);
        ctx.fillText(name, p.x, p.y);
      });
      ctx.textAlign = 'left';
      for (const d of days)
        if (d.date.getDate() === 1) {
          const p = api.toPixel(d.col + (d.row ? 1 : 0), -0.5);
          ctx.fillText(MONTHS[d.date.getMonth()], p.x, p.y);
        }
    },
    tooltip: {
      formatter: (p) =>
        p.type === 'node'
          ? `<b>${p.name}</b><br>${when.get(p.node!.id)!.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}<br>${p.value} pessoas`
          : p.name,
    },
  });
  return () => chart.destroy();
}
