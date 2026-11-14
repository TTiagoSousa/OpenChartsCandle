import { createBarChart, type BarSeries } from 'openchartscandle/bar';
import { createPieChart } from 'openchartscandle/pie';

// Índices económicos por região e por ano (linha do tempo): barras empilhadas por setor
// e uma pizza com o total de cada setor no ano escolhido.
const REGIONS = ['Norte', 'Centro', 'Lisboa', 'Alentejo', 'Algarve', 'Açores', 'Madeira', 'Oeste'];
const SECTORS = ['Primário', 'Secundário', 'Terciário'];
const YEARS = Array.from({ length: 10 }, (_, i) => 2002 + i);
const BASE = [[9, 38, 52], [11, 30, 40], [3, 45, 120], [14, 12, 18], [5, 6, 24], [2, 3, 8], [1, 4, 9], [8, 20, 22]];
const GROWTH = [0.01, 0.025, 0.05];

const value = (r: number, s: number, y: number): number => +(BASE[r][s] * Math.pow(1 + GROWTH[s], y - 2002) * (1 + 0.04 * Math.sin(r + y))).toFixed(1);
const seriesFor = (y: number): BarSeries[] => SECTORS.map((name, s) => ({ name, data: REGIONS.map((_, r) => value(r, s, y)) }));
const pieFor = (y: number) => SECTORS.map((label, s) => ({ label, value: +REGIONS.reduce((a, _, r) => a + value(r, s, y), 0).toFixed(1) }));

export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;padding:8px;align-items:center';
  const chartBox = document.createElement('div');
  chartBox.style.cssText = 'height:calc(100% - 46px)';
  const pieBox = document.createElement('div');
  pieBox.style.cssText = 'position:absolute;right:16px;top:56px;width:170px;height:150px;z-index:2';
  el.append(bar, chartBox, pieBox);

  let year = YEARS[0];
  const chart = createBarChart(chartBox, { categories: REGIONS, series: seriesFor(year), stacked: true, legend: { position: 'top', align: 'start' }, valueFormatter: (v) => `${v} M€` });
  const pie = createPieChart(pieBox, { data: pieFor(year), innerRadius: 0.55, legend: { show: false }, background: 'transparent', center: { title: String(year) } });

  const buttons = YEARS.map((y) => {
    const b = document.createElement('button');
    b.className = 'ex-btn';
    b.textContent = String(y);
    b.addEventListener('click', () => show(y));
    return b;
  });
  const play = document.createElement('button');
  play.className = 'ex-btn';
  play.textContent = '▶ Reproduzir';
  bar.append(play, ...buttons);

  const show = (y: number): void => {
    year = y;
    buttons.forEach((b, i) => b.classList.toggle('is-on', YEARS[i] === y));
    chart.setData(REGIONS, seriesFor(y));
    pie.setData(pieFor(y));
    pie.setOptions({ center: { title: String(y) } });
  };
  let timer = 0;
  play.addEventListener('click', () => {
    if (timer) {
      clearInterval(timer);
      timer = 0;
      play.textContent = '▶ Reproduzir';
      return;
    }
    play.textContent = '⏸ Pausar';
    timer = window.setInterval(() => show(year >= YEARS[YEARS.length - 1] ? YEARS[0] : year + 1), 1500);
  });
  show(year);

  return () => {
    clearInterval(timer);
    chart.destroy();
    pie.destroy();
    bar.remove();
    chartBox.remove();
    pieBox.remove();
  };
}
