import { createScatterChart } from 'openchartscandle/scatter';
import { WEEKDAYS, seeded } from '../data';

// Calendário com bolhas: um ano de passos diários, uma coluna por semana e uma linha por dia.
// O tamanho segue o número de passos e os 12 melhores dias pulsam. A grelha, os meses e as linhas
// entre meses são desenhados no `underlay`. Dados gerados.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function mount(el: HTMLElement): () => void {
  const year = 2026;
  const first = (new Date(year, 0, 1).getDay() + 6) % 7; // monday = 0
  const rnd = seeded(14);
  const days: { w: number; d: number; date: Date; v: number }[] = [];
  for (let t = new Date(year, 0, 1); t.getFullYear() === year; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1)) {
    const k = days.length + first;
    const d = k % 7;
    const season = 1 + 0.35 * Math.sin(((t.getMonth() - 2) / 12) * Math.PI * 2);
    days.push({ w: Math.floor(k / 7), d, date: t, v: Math.round((d > 4 ? 5200 : 7800) * season * (0.5 + rnd() * 0.9)) });
  }
  const weeks = days[days.length - 1].w + 1;
  const max = Math.max(...days.map((x) => x.v));
  const cell = Math.max(4, (el.clientWidth - 60) / weeks);
  const top = [...days].sort((a, b) => b.v - a.v).slice(0, 12);
  const point = (x: (typeof days)[number]) => ({ x: x.w, y: WEEKDAYS[x.d], values: [x.v], name: x.date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' }) });
  const size = (v: number): number => cell * (0.15 + 0.8 * (v / max));
  const chart = createScatterChart(el, {
    series: [
      { name: 'Passos', color: '#089981', data: days.filter((x) => !top.includes(x)).map((x) => ({ ...point(x), size: size(x.v) })) },
      { name: 'Top 12', color: '#f23645', effect: { scale: 2.2 }, data: top.map((x) => ({ ...point(x), size: size(x.v) })) },
    ],
    xAxis: { show: false, min: -0.5, max: weeks - 0.5, grid: false },
    yAxis: { categories: WEEKDAYS, inverse: true, grid: false },
    legend: { position: 'bottom' },
    padding: 10,
    animation: { delay: 'x' },
    tooltip: { formatter: (p) => `<b>${p.name}</b><br>${Number(p.values[2]).toLocaleString('pt-PT')} passos` },
    underlay: (ctx, api) => {
      const cw = api.x(1) - api.x(0);
      const rh = api.y(WEEKDAYS[1]) - api.y(WEEKDAYS[0]);
      const left = (w: number): number => api.x(w) - cw / 2;
      const topOf = (d: number): number => api.y(WEEKDAYS[0]) - rh / 2 + d * rh;
      ctx.strokeStyle = 'rgba(120,123,134,0.18)';
      ctx.lineWidth = 1;
      for (const x of days) ctx.strokeRect(left(x.w), topOf(x.d), cw, rh);
      // a line between months and the month names on top
      ctx.strokeStyle = 'rgba(209,212,220,0.55)';
      ctx.lineWidth = 1.5;
      ctx.font = `600 11px ${api.theme.font}`;
      ctx.fillStyle = api.theme.muted;
      ctx.textAlign = 'left';
      for (const x of days) {
        if (x.date.getDate() !== 1) continue;
        if (x.date.getMonth() > 0) {
          ctx.beginPath();
          ctx.moveTo(left(x.w + 1), topOf(0));
          ctx.lineTo(left(x.w + 1), topOf(x.d));
          ctx.lineTo(left(x.w), topOf(x.d));
          ctx.lineTo(left(x.w), topOf(7));
          ctx.stroke();
        }
        ctx.fillText(MONTHS[x.date.getMonth()], left(x.w + (x.d ? 1 : 0)) + 2, topOf(0) - 6);
      }
    },
  });
  return () => chart.destroy();
}
