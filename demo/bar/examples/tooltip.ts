import { createBarChart, type BarOptions } from 'openchartscandle/bar';
import { MONTHS, choice, h, sales2024, sales2025 } from '../data';

// Tooltip: partilhado (todas as séries do mês), barra única, ou um formatter próprio que
// calcula o crescimento de um ano para o outro.
const growth: BarOptions['tooltip'] = {
  formatter: (ctx) => {
    const [a, b] = ctx.items;
    if (!a || !b) return `<b>${ctx.category}</b>`;
    const g = ((b.value - a.value) / a.value) * 100;
    return `<div class="bc-tooltip__head">${ctx.category}</div>
      <div class="bc-tooltip__row"><span class="bc-tooltip__dot" style="background:${a.color}"></span>${a.series.name}<b>${a.value} M€</b></div>
      <div class="bc-tooltip__row"><span class="bc-tooltip__dot" style="background:${b.color}"></span>${b.series.name}<b>${b.value} M€</b></div>
      <div class="bc-tooltip__total"><span>Crescimento</span><b style="color:${g >= 0 ? '#089981' : '#f23645'}">${g >= 0 ? '+' : ''}${g.toFixed(1)}%</b></div>`;
  },
};

export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  let chart: ReturnType<typeof createBarChart>;
  el.append(
    h(
      'div',
      { class: 'ex-toolbar' },
      choice<BarOptions['tooltip']>('Tooltip', [['Partilhado', {}], ['Barra única', { mode: 'single' }], ['Formatter', growth]], growth, (v) => chart.setOptions({ tooltip: v }, false)),
    ),
    host,
  );
  chart = createBarChart(host, {
    categories: MONTHS,
    series: [
      { name: '2024', data: sales2024, color: '#5d606b' },
      { name: '2025', data: sales2025 },
    ],
    tooltip: growth,
    valueFormatter: (v) => `${v} M€`,
  });
  return () => chart.destroy();
}
