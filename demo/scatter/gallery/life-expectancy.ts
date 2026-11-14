import { createScatterChart, type ScatterSeries } from 'openchartscandle/scatter';
import { REGIONS, REGION_COLORS, YEARS, countries } from '../data';

// Esperança de vida e riqueza de 36 países de 1950 a 2015, ao estilo Gapminder: as bolhas andam de
// ano para ano (o ano está ao fundo). Usa o botão ou a barra para escolher o ano. Dados aproximados.
export function mount(el: HTMLElement): () => void {
  let k = 0;
  let playing = true;
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  const host = document.createElement('div');
  host.style.cssText = 'flex:1;min-height:0';
  const bar = document.createElement('div');
  bar.className = 'ex-toolbar';
  const btn = document.createElement('button');
  btn.className = 'ex-btn';
  btn.textContent = 'Pausa';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = String(YEARS.length - 1);
  range.value = '0';
  range.style.flex = '1';
  const label = document.createElement('b');
  label.textContent = String(YEARS[0]);
  bar.append(btn, range, label);
  el.append(host, bar);
  const series = (): ScatterSeries[] =>
    REGIONS.map((r, i) => ({
      name: r,
      color: REGION_COLORS[i],
      opacity: 0.8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      data: countries(YEARS[k])
        .filter((c) => c.region === r)
        .map((c) => ({ x: c.gdp, y: c.life, values: [c.pop], name: c.name, size: 4 + Math.sqrt(c.pop) * 1.4 })),
    }));
  const chart = createScatterChart(host, {
    series: series(),
    dimensions: ['PIB por pessoa ($)', 'Esperança de vida', 'População (milhões)'],
    xAxis: { type: 'log', min: 200, max: 100000, title: 'PIB por pessoa ($)' },
    yAxis: { min: 20, max: 90, title: 'Esperança de vida' },
    legend: { position: 'right' },
    animation: { duration: 850 },
    valueFormatter: (v, d) => (d === 0 ? `$${v.toLocaleString('pt-PT')}` : d === 1 ? `${v} anos` : `${v} M`),
    underlay: (ctx, api) => {
      ctx.font = `700 ${Math.min(api.plot.h * 0.45, 120)}px ${api.theme.font}`;
      ctx.fillStyle = 'rgba(120,123,134,0.16)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(YEARS[k]), api.plot.x + api.plot.w - 8, api.plot.y + api.plot.h - 4);
    },
  });
  const go = (i: number): void => {
    k = i;
    range.value = String(k);
    label.textContent = String(YEARS[k]);
    chart.setSeries(series());
  };
  const timer = window.setInterval(() => playing && go((k + 1) % YEARS.length), 1100);
  btn.onclick = () => {
    playing = !playing;
    btn.textContent = playing ? 'Pausa' : 'Play';
  };
  range.oninput = () => go(Number(range.value));
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
