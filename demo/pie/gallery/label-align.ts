import { createPieChart, type PieChart } from 'openchartscandle/pie';
import { cells } from '../data';

// Três maneiras de alinhar as etiquetas de fora (labels.alignTo):
// 'none' logo a seguir à linha, 'line' em duas colunas ao lado da pizza, 'edge' encostadas às margens.
const DATA = [
  { label: 'Lisboa', value: 2870 },
  { label: 'Porto', value: 1720 },
  { label: 'Braga', value: 830 },
  { label: 'Coimbra', value: 610 },
  { label: 'Setúbal', value: 560 },
  { label: 'Faro', value: 450 },
  { label: 'Aveiro', value: 420 },
  { label: 'Viseu', value: 240 },
];

export function mount(el: HTMLElement): () => void {
  const modes = ['none', 'line', 'edge'] as const;
  const hosts = cells(el, 3);
  const charts: PieChart[] = modes.map((alignTo, i) =>
    createPieChart(hosts[i], {
      title: `alignTo: '${alignTo}'`,
      data: DATA,
      legend: { show: false },
      labels: { position: 'outside', content: 'label', alignTo, minPercent: 0, fontWeight: 500 },
    }),
  );
  return () => charts.forEach((c) => c.destroy());
}
