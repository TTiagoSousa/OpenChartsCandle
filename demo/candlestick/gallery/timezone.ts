import { createChart, type TimeZoneId } from 'openchartscandle/candlestick';
import { chartOptions, choice, inCard, makeBars, withBar } from '../data';

// Fuso horário do eixo e da cruz: a opção timezone e chart.setTimezone.
// As mesmas velas de 15 minutos em UTC, Nova Iorque ou Tóquio.
export function mount(el: HTMLElement): () => void {
  const zones: [string, TimeZoneId][] = [['UTC', 'UTC'], ['Nova Iorque', 'America/New_York'], ['Tóquio', 'Asia/Tokyo'], ['Browser', 'local']];
  const host = inCard(el) ? el : withBar(el, choice(zones, 'America/New_York', (tz) => chart.setTimezone(tz)));
  const chart = createChart(host, chartOptions(el, { timezone: 'America/New_York' }));
  chart.setData(makeBars(300, { seed: 5, tf: 900 }), 900);
  chart.showLastBars(110);
  return () => chart.destroy();
}
