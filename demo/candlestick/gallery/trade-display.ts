import { createChart } from 'openchartscandle/candlestick';
import { button, chartOptions, choice, externalTrades, makeBars, withBar } from '../data';

// Os teus próprios botões a ligar e desligar: só entradas, só saídas, ambas, e a linha.
// Tudo com chart.setTradeDisplay({ entries, exits, lines }).
export function mount(el: HTMLElement): () => void {
  const lineBtn = button('Linha: ligada', () => {
    chart.setTradeDisplay({ lines: !chart.tradeDisplay.lines });
  });
  const host = withBar(
    el,
    choice([['Ambas', 'both'], ['Entradas', 'entries'], ['Saídas', 'exits']], 'both', (mode) =>
      chart.setTradeDisplay({ entries: mode !== 'exits', exits: mode !== 'entries' }),
    ),
    lineBtn,
  );
  const chart = createChart(host, chartOptions(el));
  const bars = makeBars(300, { seed: 7 });
  chart.setData(bars, 3600);
  chart.setTrades(externalTrades(bars, { openLast: true }));
  chart.showLastBars(110);

  // o evento tradeDisplayChanged mantém o botão certo, mude quem mudar
  const off = chart.tradeDisplayChanged.on((d) => {
    lineBtn.textContent = `Linha: ${d.lines ? 'ligada' : 'desligada'}`;
    lineBtn.disabled = !(d.entries && d.exits); // a linha precisa das duas pontas
  });
  return () => {
    off();
    chart.destroy();
  };
}
