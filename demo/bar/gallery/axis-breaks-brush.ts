import { createBarChart } from 'openchartscandle/bar';

// Quebra no eixo com seleção: arrasta para selecionar barras; o botão liga e desliga a quebra.
const BREAKS = [{ from: 1500, to: 18000 }];

export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const btn = document.createElement('button');
  btn.className = 'ex-btn';
  btn.style.cssText = 'position:absolute;right:16px;top:10px;z-index:2';
  btn.textContent = 'Mostrar escala completa';
  const info = document.createElement('div');
  info.style.cssText = 'position:absolute;left:16px;top:14px;z-index:2;font-size:12px;opacity:.8;pointer-events:none';
  info.textContent = 'Arrasta para selecionar barras';
  const chart = createBarChart(el, {
    categories: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Feriado'],
    series: [{ name: 'Visitas', data: [420, 510, 380, 20400, 470, 18900, 560, 610] }],
    valueAxis: { breaks: BREAKS },
    brush: true,
    legend: { show: false },
  });
  el.append(btn, info);
  let cut = true;
  btn.addEventListener('click', () => {
    cut = !cut;
    btn.textContent = cut ? 'Mostrar escala completa' : 'Cortar escala';
    chart.setOptions({ valueAxis: { breaks: cut ? BREAKS : [] } });
  });
  const off = chart.on('brush', (items) => {
    const sum = items.reduce((a, d) => a + d.value, 0);
    info.textContent = items.length ? `${items.length} barras · total ${sum.toLocaleString('pt-PT')}` : 'Arrasta para selecionar barras';
  });
  return () => {
    off();
    chart.destroy();
    btn.remove();
    info.remove();
  };
}
