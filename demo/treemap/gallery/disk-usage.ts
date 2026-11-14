import { createTreemap } from 'openchartscandle/treemap';
import { kb, projectTree } from '../data';

// Uso do disco deste projeto: pastas e ficheiros pelo tamanho em bytes.
// Clica numa pasta para entrar; o caminho em baixo volta atrás. O tooltip mostra o caminho completo.
export function mount(el: HTMLElement): () => void {
  let chart: ReturnType<typeof createTreemap> | null = null;
  let dead = false;
  void projectTree('all').then((data) => {
    if (dead) return;
    chart = createTreemap(el, {
      data,
      rootName: 'openchartscandle',
      valueFormatter: kb,
      visibleMin: 300,
      upperLabel: { height: 24 },
      levels: [
        { gap: 1, borderWidth: 0, borderColor: '#777' },
        { gap: 1, borderWidth: 4, borderColor: '#555' },
        { gap: 1, borderWidth: 4, colorSaturation: [0.35, 0.5] },
        { gap: 1, colorSaturation: [0.35, 0.5], colorLightness: [0.4, 0.55] },
      ],
      tooltip: {
        formatter: (n) =>
          `<div class="tm-tooltip__head">Uso do disco</div><div>${n.path.join('/')}</div><div class="tm-tooltip__row"><span>Tamanho</span><b>${kb(n.value)}</b></div>`,
      },
    });
  });
  return () => {
    dead = true;
    chart?.destroy();
  };
}
