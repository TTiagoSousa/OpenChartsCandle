import { createTreemap } from 'openchartscandle/treemap';
import { choice, kb, projectTree } from '../data';

// Transição entre treemap e sunburst: os mesmos dados (o tamanho do código desta biblioteca,
// por pasta e ficheiro) mudam de forma a cada 3 s, e cada retângulo transforma-se no seu setor.
export function mount(el: HTMLElement): () => void {
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const bar = document.createElement('div');
  bar.className = 'ex-toolbar';
  const host = document.createElement('div');
  host.style.cssText = 'flex:1;min-height:0';
  el.append(bar, host);
  let chart: ReturnType<typeof createTreemap> | null = null;
  let auto = true;
  let dead = false;
  void projectTree('src').then((data) => {
    if (dead) return;
    chart = createTreemap(host, {
      data,
      rootName: 'src',
      valueFormatter: kb,
      breadcrumb: false,
      drilldown: false,
      animation: { duration: 1000 },
      levels: [{ gap: 2 }, { gap: 1, colorLightness: [0.38, 0.6] }],
      sunburst: { innerRadius: 0.18, labelRotate: 'radial' },
    });
  });
  const timer = window.setInterval(() => {
    if (auto && chart) chart.setType(chart.type === 'treemap' ? 'sunburst' : 'treemap');
  }, 3000);
  bar.append(
    choice('Forma', [['Automático', 'auto'], ['Treemap', 'treemap'], ['Sunburst', 'sunburst']], 'auto', (v) => {
      auto = v === 'auto';
      if (!auto) chart?.setType(v as 'treemap' | 'sunburst');
    }),
  );
  return () => {
    dead = true;
    clearInterval(timer);
    chart?.destroy();
    bar.remove();
    host.remove();
  };
}
