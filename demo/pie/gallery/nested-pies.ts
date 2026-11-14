import { createPieChart } from 'openchartscandle/pie';

// Pizzas aninhadas: no centro, as visitas por tipo de acesso; à volta (rings), o detalhe de cada fonte,
// com etiquetas ricas (nome da série, nome, valor e percentagem numa caixa).
export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    seriesName: 'Tipo de acesso',
    data: [
      { label: 'Direto', value: 1548, color: '#2962ff' },
      { label: 'Marketing', value: 775, color: '#089981' },
      { label: 'Pesquisa', value: 679, color: '#ff9800' },
    ],
    outerRadius: 0.42,
    labels: { position: 'inside', content: 'label', minPercent: 0 },
    rings: [
      {
        name: 'Fonte',
        innerRadius: 0.62,
        outerRadius: 0.85,
        colors: ['#5c8dff', '#7e57c2', '#26a69a', '#ef5350', '#ffb74d', '#4dd0e1', '#f06292', '#9ccc65'],
        data: [
          { label: 'Baidu', value: 1048 },
          { label: 'Direto ', id: 'direct-2', value: 335 },
          { label: 'Email', value: 310 },
          { label: 'Google', value: 251 },
          { label: 'Union Ads', value: 234 },
          { label: 'Bing', value: 147 },
          { label: 'Vídeo', value: 135 },
          { label: 'Outros', value: 102 },
        ],
        labels: {
          position: 'outside',
          minPercent: 0,
          lineLength: 12,
          rich: (s) => [
            [{ text: 'Fonte', fontSize: 10, fontWeight: 400, color: '#787b86' }],
            [
              { text: `${s.label}: `, fontWeight: 700 },
              { text: `${s.value} `, fontWeight: 400 },
              { text: `${s.percent.toFixed(1)}%`, background: '#4c5058', color: '#fff', fontSize: 11, padding: 2 },
            ],
          ],
        },
      },
    ],
    legend: { position: 'left', values: false, align: 'start' },
  });
  return () => chart.destroy();
}
