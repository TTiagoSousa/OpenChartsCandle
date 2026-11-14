import { createCalendarChart } from 'openchartscandle/calendar';
import { key, monthDays, seeded, withToolbar } from '../data';

// Uma pizza em cada dia: como foram passadas as 24 horas (trabalho, lazer e sono). Desenhada em `renderCell`
// com a caixa de cada dia. Dados gerados.
const PARTS = [
  { name: 'Trabalho', color: '#2962ff' },
  { name: 'Lazer', color: '#ff9800' },
  { name: 'Sono', color: '#089981' },
];

export function mount(el: HTMLElement): () => void {
  const rnd = seeded(8);
  const data = monthDays(2026, 1).map((d) => {
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const work = weekend ? Math.round(rnd() * 2) : 7 + Math.round(rnd() * 3);
    const sleep = 6 + Math.round(rnd() * 3);
    return { date: key(d), hours: [work, 24 - work - sleep, sleep] };
  });
  // the legend: one colored dot per part, in a bar on top
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;gap:14px;font-size:12px';
  legend.innerHTML = PARTS.map((p) => `<span><span style="color:${p.color}">●</span> ${p.name}</span>`).join('');
  const chart = createCalendarChart(withToolbar(el, legend), {
    range: '2026-02',
    orient: 'vertical',
    monthLabel: false,
    title: 'Fevereiro de 2026',
    data,
    label: { position: 'top-left', fontSize: 11 },
    renderCell: (ctx, c, api) => {
      const hours = c.datum?.hours as number[] | undefined;
      if (!hours) return;
      const r = Math.min(c.w, c.h) * 0.3 * api.progress;
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2 + 4;
      let a = -Math.PI / 2;
      hours.forEach((h, i) => {
        const b = a + (h / 24) * Math.PI * 2;
        ctx.fillStyle = PARTS[i].color;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, a, b);
        ctx.closePath();
        ctx.fill();
        a = b;
      });
    },
    tooltip: {
      formatter: (c) =>
        `<b>${c.date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</b>` +
        ((c.datum?.hours as number[] | undefined) ?? []).map((h, i) => `<br><span style="color:${PARTS[i].color}">●</span> ${PARTS[i].name}: ${h} h`).join(''),
    },
  });
  return () => chart.destroy();
}
