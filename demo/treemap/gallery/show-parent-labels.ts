import { createTreemap } from 'openchartscandle/treemap';
import { kb, projectTree } from '../data';

// Cabeçalhos com o nome dos pais (upperLabel): cada pasta mostra o nome numa faixa por cima
// dos ficheiros. Os níveis têm molduras e cores mais claras à medida que se desce.
export function mount(el: HTMLElement): () => void {
  let chart: ReturnType<typeof createTreemap> | null = null;
  let dead = false;
  void projectTree('src').then((data) => {
    if (dead) return;
    chart = createTreemap(el, {
      data,
      rootName: 'src',
      upperLabel: { height: 22 },
      valueFormatter: kb,
      levels: [
        { gap: 4, borderWidth: 3, borderColor: '#2a2e39' },
        { gap: 2, borderWidth: 2, colorSaturation: [0.35, 0.6] },
        { gap: 1, borderWidth: 1, colorLightness: [0.42, 0.62] },
      ],
    });
  });
  return () => {
    dead = true;
    chart?.destroy();
  };
}
