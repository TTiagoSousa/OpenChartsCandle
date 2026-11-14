import { createPieChart, type PieDatum } from 'openchartscandle/pie';
import { eur, h, portfolio } from '../data';

// Dados ao vivo: a cada segundo os preços mexem e setData() anima as fatias para os novos
// ângulos. Com sort: 'desc' a ordem também se ajusta. Os botões acrescentam/removem ativos.
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  let data: PieDatum[] = portfolio.map((d) => ({ ...d }));
  const chart = createPieChart(host, {
    data,
    innerRadius: 0.58,
    padAngle: 1,
    cornerRadius: 3,
    sort: 'desc',
    valueFormatter: eur,
    animation: { duration: 600 },
    center: { title: 'Carteira ao vivo' },
  });

  const extras: PieDatum[] = [
    { label: 'Imobiliário', value: 7000 },
    { label: 'Mercados emergentes', value: 5200 },
    { label: 'Matérias-primas', value: 3100 },
  ];
  bar.append(
    h('button', { class: 'ex-btn', text: '+ Ativo', onclick: () => {
      const next = extras.find((x) => !data.some((d) => d.label === x.label));
      if (next) chart.setData((data = [...data, { ...next }]));
    } }),
    h('button', { class: 'ex-btn', text: '− Ativo', onclick: () => data.length > 2 && chart.setData((data = data.slice(0, -1))) }),
    h('button', { class: 'ex-btn', text: 'Crash −30% cripto', onclick: () => chart.setData((data = data.map((d) => (d.label === 'Cripto' ? { ...d, value: d.value * 0.7 } : d)))) }),
  );

  const timer = window.setInterval(() => {
    data = data.map((d) => ({ ...d, value: Math.max(500, d.value * (1 + (Math.random() - 0.5) * 0.06)) }));
    chart.setData(data);
  }, 1200);

  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
