import { createPieChart } from 'openchartscandle/pie';
import { choice, h, sectors } from '../data';

// Estilo das fatias: espaço entre fatias (padAngle), cantos arredondados (cornerRadius),
// contorno, tamanho do buraco e paletas. Tudo muda ao vivo com setOptions().
const PALETTES: Record<string, string[]> = {
  Padrão: ['#2962ff', '#089981', '#f23645', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#4caf50', '#ffc107', '#3f51b5', '#795548'],
  Azuis: ['#0d47a1', '#1565c0', '#1976d2', '#1e88e5', '#2196f3', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb', '#5c6bc0', '#7986cb'],
  Pastel: ['#8ecae6', '#ffb4a2', '#cdb4db', '#a8dadc', '#ffd6a5', '#caffbf', '#fdffb6', '#bdb2ff', '#ffc6ff', '#9bf6ff', '#e5989b'],
  Neon: ['#00e0c6', '#ff4d8d', '#ffe600', '#7c4dff', '#00b0ff', '#ff6d00', '#76ff03', '#f50057', '#18ffff', '#ffd740', '#e040fb'],
};

export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  const chart = createPieChart(host, { data: sectors, innerRadius: 0.55, padAngle: 2, cornerRadius: 6, sort: 'desc', valueFormatter: (v) => `${v}%` });

  bar.append(
    choice('Buraco', [['Pizza', 0], ['Donut', 0.55], ['Fino', 0.8]], 0.55, (innerRadius) => chart.setOptions({ innerRadius })),
    choice('Espaço', [['0°', 0], ['1°', 1], ['2°', 2], ['4°', 4]], 2, (padAngle) => chart.setOptions({ padAngle })),
    choice('Cantos', [['0', 0], ['4', 4], ['8', 8], ['14', 14]], 6, (cornerRadius) => chart.setOptions({ cornerRadius })),
    choice('Paleta', Object.keys(PALETTES).map((k) => [k, k] as [string, string]), 'Padrão', (k) => chart.setOptions({ colors: PALETTES[k] })),
  );

  return () => chart.destroy();
}
