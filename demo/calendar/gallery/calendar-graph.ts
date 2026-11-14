import { createCalendarChart } from 'openchartscandle/calendar';
import { dailyValues, seeded } from '../data';

// Um grafo por cima do calendário: alguns dias são nós (reuniões, por exemplo) e as curvas ligam cada um aos
// seguintes. O calendário dá a caixa de cada dia (api.cell) e o grafo é desenhado em `graphic`. Dados gerados.
export function mount(el: HTMLElement): () => void {
  const rnd = seeded(5);
  const days = dailyValues(2026, 3, 100).filter(([d]) => d < '2026-05-01');
  const nodes = days.filter(() => rnd() < 0.2).map(([date], i) => ({ date, size: 4 + rnd() * 6, name: `R${i + 1}` }));
  const links = nodes.flatMap((n, i) => [nodes[i + 1], nodes[i + 2 + Math.floor(rnd() * 3)]].filter(Boolean).map((m) => [n, m] as const));
  const chart = createCalendarChart(el, {
    range: ['2026-01-01', '2026-04-30'],
    data: days,
    visualMap: { min: 0, max: 100, colors: ['#1a2333', '#2a3a5c'], show: false },
    graphic: (ctx, api) => {
      const at = (d: string): { x: number; y: number } => {
        const c = api.cell(d)!;
        return { x: c.x + c.w / 2, y: c.y + c.h / 2 };
      };
      ctx.globalAlpha = api.progress;
      ctx.strokeStyle = 'rgba(255,152,0,0.55)';
      ctx.lineWidth = 1.2;
      for (const [a, b] of links) {
        const p = at(a.date);
        const q = at(b.date);
        // a curve bent to one side, so links along the same row do not overlap
        const mx = (p.x + q.x) / 2 - (q.y - p.y) * 0.3;
        const my = (p.y + q.y) / 2 + (q.x - p.x) * 0.3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(mx, my, q.x, q.y);
        ctx.stroke();
      }
      ctx.fillStyle = '#ff9800';
      for (const n of nodes) {
        const p = at(n.date);
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.size * api.progress, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    tooltip: {
      formatter: (c) => {
        const n = nodes.find((x) => x.date === c.key);
        return `<b>${c.date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</b>${n ? `<br>Reunião ${n.name}` : ''}`;
      },
    },
  });
  return () => chart.destroy();
}
