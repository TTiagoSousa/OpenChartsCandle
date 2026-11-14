import { createChart, createTradeList } from 'openchartscandle/candlestick';
import { chartOptions, externalTrades, makeBars } from '../data';

// Lista de trades ligada ao gráfico (createTradeList):
// - Ambas / Entradas / Saídas e o interruptor da linha;
// - "Ir para id…": escreve T-1005 e Enter (entrada) ou Shift+Enter (saída);
// - clica numa linha para ir à entrada, ou no preço de entrada / saída para ir a esse ponto;
// - clicar num trade no gráfico seleciona-o na lista.
export function mount(el: HTMLElement): () => void {
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const chartEl = document.createElement('div');
  chartEl.style.cssText = 'flex:1.4;min-height:0;position:relative';
  const listEl = document.createElement('div');
  listEl.style.cssText = 'flex:1;min-height:0';
  el.append(chartEl, listEl);

  const chart = createChart(chartEl, chartOptions(el));
  const bars = makeBars(500, { seed: 7 });
  chart.setData(bars, 3600);
  chart.setTrades(externalTrades(bars, { openLast: true }));
  chart.showLastBars(110);

  const list = createTradeList(listEl, chart);
  return () => {
    list.destroy();
    chart.destroy();
  };
}
