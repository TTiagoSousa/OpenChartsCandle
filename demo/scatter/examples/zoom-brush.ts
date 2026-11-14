import { createScatterChart, type ScatterPointInfo } from 'openchartscandle/scatter';
import { choice, gauss, h, seeded, withToolbar } from '../data';

// Zoom e seleção com 20 000 pontos (risco × retorno de carteiras simuladas).
// Modo zoom: roda do rato faz zoom à volta do cursor, arrastar move, duplo clique repõe.
// Modo seleção: arrasta um retângulo; o evento 'brush' devolve os pontos e os outros ficam esbatidos.
export function mount(el: HTMLElement): () => void {
  const rnd = seeded(31);
  const data = Array.from({ length: 20000 }, () => {
    const risk = 4 + Math.abs(gauss(rnd)) * 9;
    return [+risk.toFixed(2), +(1 + risk * 0.45 + gauss(rnd) * 3).toFixed(2)];
  });
  const info = h('div', { style: 'padding:6px 12px;font-size:12px;color:#9598a1;min-height:18px' });
  info.textContent = 'Nada selecionado.';
  const host = withToolbar(
    el,
    choice('Arrastar', [['Zoom e pan', 'zoom'], ['Seleção', 'brush']], 'zoom', (m) => chart.setOptions({ zoom: m === 'zoom', brush: m === 'brush' }, false)),
    h('button', { class: 'ex-btn', text: 'Zoom 5–10 %', onclick: () => chart.setZoom({ x: [4, 12], y: [0, 12] }) }),
    h('button', { class: 'ex-btn', text: 'Repor', onclick: () => chart.resetZoom() }),
  );
  el.append(info);
  const chart = createScatterChart(host, {
    series: [{ name: 'Carteiras', data, symbolSize: 3, color: '#2962ff', opacity: 0.55 }],
    dimensions: ['Risco (%)', 'Retorno (%)'],
    xAxis: { title: 'Risco (volatilidade, %)' },
    yAxis: { title: 'Retorno anual (%)' },
    zoom: true,
  });
  chart.on('brush', (pts: ScatterPointInfo[]) => {
    if (!pts.length) return void (info.textContent = 'Nada selecionado.');
    const avg = (d: 0 | 1) => (pts.reduce((a, p) => a + Number(p.values[d]), 0) / pts.length).toFixed(2);
    info.textContent = `${pts.length.toLocaleString('pt-PT')} carteiras · risco médio ${avg(0)} % · retorno médio ${avg(1)} %`;
  });
  chart.on('zoom', (z) => (info.textContent = `Zoom: x ${z.x.map((v) => v.toFixed(1)).join(' – ')}, y ${z.y.map((v) => v.toFixed(1)).join(' – ')}`));
  return () => chart.destroy();
}
