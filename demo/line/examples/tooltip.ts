import { createLineChart, type LineTooltipContext } from 'openchartscandle/line';
import { choice, h, usd, walk } from '../data';

// Tooltip: 'shared' mostra todas as séries no x do cursor; 'single' só o ponto mais próximo.
// O formatter recebe { x, label, points } e devolve HTML — aqui com a diferença entre séries.
function formatter(ctx: LineTooltipContext): string {
  const [a, b] = ctx.points;
  const diff = a && b ? a.y - b.y : 0;
  return `
    <div style="font-weight:700;margin-bottom:6px">${ctx.label}</div>
    ${ctx.points.map((p) => `<div style="display:flex;gap:10px;justify-content:space-between"><span style="color:${p.color}">● ${p.series.name}</span><b>${usd(p.y)}</b></div>`).join('')}
    ${a && b ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(128,128,128,.3);color:${diff >= 0 ? '#089981' : '#f23645'}">Diferença: ${diff >= 0 ? '+' : ''}${usd(diff)}</div>` : ''}`;
}

export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);
  const chart = createLineChart(host, {
    series: [
      { name: 'Real', data: walk(51, 90, 50000, 0.015, 0.001), color: '#2962ff', points: { size: 3 } },
      { name: 'Previsto', data: walk(52, 90, 50000, 0.008, 0.0012), color: '#ff9800', dash: [6, 4] },
    ],
    tooltip: { formatter },
    crosshair: { horizontal: true },
  });
  bar.append(
    choice<'shared' | 'single'>('Modo', [['Partilhado', 'shared'], ['Ponto único', 'single']], 'shared', (mode) => chart.setOptions({ tooltip: { mode, formatter: mode === 'shared' ? formatter : undefined } }, false)),
  );
  return () => chart.destroy();
}
