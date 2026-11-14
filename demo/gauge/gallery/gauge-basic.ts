import { createGauge } from 'openchartscandle/gauge';

export function mount(el: HTMLElement): () => void {
  const gauge = createGauge(el, {
    value: 50,
    title: 'Pontuação',
    progress: { color: '#5470c6' },
  });
  return () => gauge.destroy();
}
