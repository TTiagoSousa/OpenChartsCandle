import { createPieChart } from 'openchartscandle/pie';
import { choice, eur, h, portfolio } from '../data';

// Legenda: posição (direita, esquerda, cima, baixo), com ou sem valores, e clicável:
// clicar num item esconde/mostra a fatia (as percentagens são recalculadas com animação).
// Passar o rato por um item destaca a fatia no gráfico.
export function mount(el: HTMLElement): () => void {
  const host = h('div', { class: 'ex-fill' });
  const bar = h('div', { class: 'ex-toolbar' });
  el.append(bar, host);

  let position: 'right' | 'left' | 'top' | 'bottom' = 'right';
  let values = true;
  const chart = createPieChart(host, { data: portfolio, innerRadius: 0.5, valueFormatter: eur, legend: { position, values } });
  const apply = (): void => chart.setOptions({ legend: { position, values, interactive: true, show: true } });

  bar.append(
    choice<'right' | 'left' | 'top' | 'bottom'>('Posição', [['Direita', 'right'], ['Esquerda', 'left'], ['Cima', 'top'], ['Baixo', 'bottom']], position, (p) => ((position = p), apply())),
    choice('Valores', [['Sim', true], ['Não', false]], values, (v) => ((values = v), apply())),
    h('button', { class: 'ex-btn', text: 'Esconder "Cripto"', onclick: () => chart.toggle('Cripto') }),
  );

  return () => chart.destroy();
}
