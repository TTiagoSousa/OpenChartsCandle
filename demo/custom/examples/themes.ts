import { createCustomChart, type CustomOptions } from 'openchartscandle/custom';
import { monthlyPnl, treemapGrid } from '../data';

// Temas: escuro (por omissão), claro, um tema próprio e um gráfico sem fundo dentro de um card.
// O renderItem usa api.theme e api.style() para seguir as cores do tema.
const base = (bar?: string): CustomOptions => ({
  xAxis: { type: 'category' },
  yAxis: { name: 'k€' },
  series: [
    {
      name: 'Resultado',
      data: monthlyPnl(),
      renderItem: (p, api) => {
        const v = Number(api.value(1));
        const [x, y] = api.coord([api.value(0), v]);
        const [, y0] = api.coord([api.value(0), 0]);
        const w = api.size([1, 0])[0] * 0.6;
        return {
          type: 'rect',
          shape: { x: x - w / 2, y: Math.min(y, y0), width: w, height: Math.abs(y0 - y), r: 2 },
          style: api.style({ fill: bar ?? (v >= 0 ? '#089981' : '#f23645') }),
          enterFrom: { shape: { y: y0, height: 0 } },
        };
      },
    },
  ],
});

export function mount(el: HTMLElement): () => void {
  const hosts = treemapGrid(el, ['Escuro', 'Claro', 'Tema próprio', "Num card (background: 'transparent')"], 300);
  hosts[1].parentElement!.className = 'pc-demo-card';
  hosts[3].parentElement!.style.background = 'linear-gradient(135deg, #1e3c72, #2a5298)';
  const charts = [
    createCustomChart(hosts[0], base()),
    createCustomChart(hosts[1], { ...base(), theme: 'light' }),
    createCustomChart(hosts[2], { ...base('#d500f9'), theme: { background: '#0b0f19', text: '#e0e6f0', grid: 'rgba(213, 0, 249, 0.12)', axis: '#3a2a4a' } }),
    createCustomChart(hosts[3], { ...base('#ffffff'), background: 'transparent', theme: { text: '#ffffff', muted: 'rgba(255,255,255,0.75)', grid: 'rgba(255,255,255,0.15)', axis: 'rgba(255,255,255,0.4)' } }),
  ];
  return () => charts.forEach((c) => c.destroy());
}
