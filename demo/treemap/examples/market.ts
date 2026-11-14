import { CHANGE_COLORS, createTreemap, type TreeNode } from 'openchartscandle/treemap';
import { choice, h, marketData, withAverages } from '../data';

// Mapa do mercado: setores e ações, a área é a capitalização e a cor a variação do dia
// (vermelho → cinzento → verde entre -3% e +3%). Atualiza a cada 2 s com setData().
const pct = (v: number): string => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  let live = true;
  let data = marketData();
  el.append(
    h(
      'div',
      { class: 'ex-toolbar' },
      choice('Tempo real', [['Ligado', true], ['Desligado', false]], true, (v) => (live = v)),
      h('button', { class: 'ex-btn', text: 'Novo dia', onclick: () => chart.setData((data = marketData())) }),
    ),
    host,
  );
  const level = { color: CHANGE_COLORS, colorMappingBy: 'value' as const, visualDimension: 1, visualMin: -3, visualMax: 3 };
  const chart = createTreemap(host, {
    data,
    rootName: 'S&P 500',
    upperLabel: { height: 20 },
    dimensions: ['Capitalização', 'Variação'],
    valueFormatter: (v, dim) => (dim === 1 ? pct(v) : `$${v.toLocaleString('pt-PT')} B`),
    label: { position: 'center', formatter: (n) => `${n.name}\n${pct(n.values[1])}` },
    // sectors colored by their own change (the value given on the sector), stocks by theirs
    levels: [{ gap: 3, ...level, visualMin: -1.5, visualMax: 1.5 }, { gap: 1, ...level }],
    animation: { duration: 600 },
  });
  const timer = window.setInterval(() => {
    if (!live) return;
    // small moves on top of the current changes
    data = withAverages(
      data.map((s) => ({
        ...s,
        children: s.children!.map((c): TreeNode => {
          const [cap, chg] = c.value as number[];
          return { ...c, value: [cap, +(chg + (Math.random() - 0.5) * 0.6).toFixed(2)] };
        }),
      })),
    );
    chart.setData(data);
  }, 2000);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
