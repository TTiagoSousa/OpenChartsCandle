import { createGauge } from 'openchartscandle/gauge';

// O mais simples: trilho, marcas, ponteiro e o valor com unidade.
export function mount(el: HTMLElement): () => void {
  const gauge = createGauge(el, {
    value: 50,
    unit: '%',
    title: 'Pressão',
    progress: false,
  });
  return () => gauge.destroy();
}
