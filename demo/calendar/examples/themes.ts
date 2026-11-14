import { createCalendarChart } from 'openchartscandle/calendar';
import { dailyValues } from '../data';
import { treemapGrid } from '../../treemap/data';

// Temas: escuro (por omissão), claro, um tema próprio e um calendário sem fundo dentro de um card.
const data = dailyValues(2026, 12, 100);

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 220);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const visualMap = { min: 0, max: 100 };
  const charts = [
    createCalendarChart(hosts[0], { range: 2026, data, visualMap }),
    createCalendarChart(hosts[1], { range: 2026, data, theme: 'light', visualMap: { ...visualMap, colors: ['#ebedf0', '#9be9a8', '#40c463', '#216e39'] } }),
    createCalendarChart(hosts[2], {
      range: 2026,
      data,
      theme: { background: '#0b0f19', text: '#e0e6f0', muted: '#5c6b84', cell: '#141c2e', cellBorder: '#0b0f19', splitLine: '#00e5ff' },
      visualMap: { ...visualMap, colors: ['#141c2e', '#d500f9', '#00e5ff'] },
      cell: { gap: 2, radius: 3, borderWidth: 0 },
    }),
    createCalendarChart(hosts[3], {
      range: 2026,
      data,
      background: 'transparent',
      visualMap: { ...visualMap, colors: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.9)'] },
      cell: { color: 'rgba(255,255,255,0.06)', gap: 2, radius: 2, borderWidth: 0 },
      splitLine: { color: 'rgba(255,255,255,0.5)' },
      dayLabel: { color: 'rgba(255,255,255,0.7)' },
      monthLabel: { color: 'rgba(255,255,255,0.85)' },
    }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
