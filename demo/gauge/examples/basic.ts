import { createGauge, trafficZones } from 'openchartscandle/gauge';
import { choice, h } from '../data';

// Velocímetro clássico: ponteiro com efeito de mola, zonas verde/amarelo/vermelho,
// marcas grandes e pequenas, e o valor na cor da zona onde está.
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  let gauge: ReturnType<typeof createGauge>;
  el.append(
    h(
      'div',
      { class: 'ex-toolbar' },
      choice('Velocidade', [['40', 40], ['90', 90], ['150', 150], ['195', 195], ['230', 230]], 90, (v) => gauge.setValue(v)),
      h('button', { class: 'ex-btn', text: 'Aleatório', onclick: () => gauge.setValue(Math.round(Math.random() * 240)) }),
    ),
    host,
  );
  gauge = createGauge(host, {
    value: 90,
    min: 0,
    max: 240,
    unit: 'km/h',
    title: 'Velocidade',
    zones: trafficZones(0, 240, [0.55, 0.8]),
    ticks: { major: 13, minor: 3 },
  });
  return () => gauge.destroy();
}
