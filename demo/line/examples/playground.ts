import { createLineChart, type LineCurve, type LineOptions, type LineSeries, type PointShape } from 'openchartscandle/line';
import { h, walk } from '../data';

// Playground: cada controlo muda uma opção e o código correspondente aparece em baixo.
interface Cfg {
  inCard: boolean;
  transparent: boolean;
  seriesCount: number;
  curve: LineCurve;
  width: number;
  area: boolean;
  areaOpacity: number;
  stacked: 'no' | 'yes' | 'percent';
  points: boolean;
  shape: PointShape;
  labels: boolean;
  dualAxis: boolean;
  beginAtZero: boolean;
  legend: 'top' | 'bottom' | 'right' | 'left' | 'off';
  legendMarker: 'line' | 'circle' | 'square';
  tooltip: 'shared' | 'single' | 'off';
  crosshairH: boolean;
  zoom: boolean;
  grid: boolean;
  theme: 'dark' | 'light';
  animation: boolean;
}

const DEFAULT: Cfg = {
  inCard: false,
  transparent: false,
  seriesCount: 3,
  curve: 'smooth',
  width: 2,
  area: false,
  areaOpacity: 0.25,
  stacked: 'no',
  points: false,
  shape: 'circle',
  labels: false,
  dualAxis: false,
  beginAtZero: false,
  legend: 'top',
  legendMarker: 'line',
  tooltip: 'shared',
  crosshairH: false,
  zoom: true,
  grid: true,
  theme: 'dark',
  animation: true,
};

const NAMES = ['Série A', 'Série B', 'Série C', 'Série D', 'Série E'];
const DATA = NAMES.map((_, i) => walk(70 + i, 60, 100 + i * 15, 0.03, 0.002 - i * 0.0008));

function seriesFor(c: Cfg): LineSeries[] {
  return NAMES.slice(0, c.seriesCount).map((name, i) => ({
    name,
    data: DATA[i],
    ...(c.dualAxis && i === c.seriesCount - 1 && c.seriesCount > 1 ? { axis: 'right' as const } : {}),
  }));
}

function toOptions(c: Cfg): LineOptions {
  const o: LineOptions = {};
  if (c.transparent) o.background = 'transparent';
  if (c.curve !== 'linear') o.curve = c.curve;
  if (c.area) o.area = c.areaOpacity !== 0.28 ? { opacity: c.areaOpacity } : true;
  if (c.stacked === 'yes') o.stacked = true;
  if (c.stacked === 'percent') o.stacked = 'percent';
  if (c.points) o.points = c.shape !== 'circle' ? { shape: c.shape } : true;
  if (!c.grid) {
    o.xAxis = { grid: false };
    o.yAxis = { grid: false };
  }
  if (c.beginAtZero) o.yAxis = { ...(o.yAxis ?? {}), beginAtZero: true };
  if (c.legend === 'off') o.legend = { show: false };
  else if (c.legend !== 'top' || c.legendMarker !== 'line') o.legend = { ...(c.legend !== 'top' ? { position: c.legend } : {}), ...(c.legendMarker !== 'line' ? { marker: c.legendMarker } : {}) };
  if (c.tooltip === 'off') o.tooltip = { show: false };
  else if (c.tooltip === 'single') o.tooltip = { mode: 'single' };
  if (c.crosshairH) o.crosshair = { horizontal: true };
  if (c.zoom) o.zoom = true;
  if (c.theme !== 'dark') o.theme = c.theme;
  if (!c.animation) o.animation = false;
  return o;
}

function codeFor(c: Cfg, o: LineOptions): string {
  const seriesCode = seriesFor(c).map((s) => {
    const extra = [s.axis ? `axis: 'right'` : '', c.width !== 2 ? `width: ${c.width}` : '', c.labels ? 'labels: true' : ''].filter(Boolean).join(', ');
    return `    { name: '${s.name}', data: dados${s.name.slice(-1)}${extra ? `, ${extra}` : ''} },`;
  });
  const body = JSON.stringify(o, null, 2).replace(/"([a-zA-Z]+)":/g, '$1:').replace(/"/g, "'").split('\n').slice(1, -1);
  return [
    "import { createLineChart } from 'openchartscandle/line';",
    "import 'openchartscandle/style.css';",
    '',
    "const chart = createLineChart(document.getElementById('linhas')!, {",
    '  series: [',
    ...seriesCode,
    '  ],',
    ...body.map((l, i) => (i === body.length - 1 || /[,{[]$/.test(l) ? l : `${l},`)),
    '});',
  ].join('\n');
}

export function mount(el: HTMLElement): () => void {
  let cfg: Cfg = { ...DEFAULT };
  const panel = h('aside', { class: 'cfg' });
  const chartBox = h('div', { class: 'pg-chart' });
  const stage = h('div', { class: 'pg-stage' }, h('div', { class: 'pg-card' }, h('div', { class: 'pg-card__title', text: 'Desempenho' }), chartBox));
  const code = h('pre', { class: 'cfg-code__pre' });
  el.append(h('div', { class: 'cfg-layout' }, panel, h('div', { class: 'cfg-main' }, stage, h('div', { class: 'cfg-code' }, h('div', { class: 'cfg-code__head', text: 'Código desta configuração' }), code))));

  const withSeriesStyle = (c: Cfg): LineSeries[] => seriesFor(c).map((s) => ({ ...s, width: c.width, labels: c.labels }));
  const chart = createLineChart(chartBox, { series: withSeriesStyle(cfg), ...toOptions(cfg) });
  const RESET: LineOptions = { background: undefined, curve: 'linear', area: false, stacked: false, points: false, xAxis: {}, yAxis: {}, legend: {}, tooltip: {}, crosshair: {}, zoom: false, theme: 'dark', animation: true };

  const apply = (animate: boolean): void => {
    const o = toOptions(cfg);
    chart.setOptions({ ...RESET, ...o, series: withSeriesStyle(cfg) }, animate);
    stage.classList.toggle('is-card', cfg.inCard);
    stage.style.setProperty('--card', cfg.theme === 'light' ? '#ffffff' : '#1b2030');
    stage.style.setProperty('--card-text', cfg.theme === 'light' ? '#131722' : '#d1d4dc');
    code.textContent = codeFor(cfg, o);
  };
  let frame = 0;
  const applySoon = (): void => {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), apply(false)));
  };

  type NumKey = 'seriesCount' | 'width' | 'areaOpacity';
  const slider = (label: string, key: NumKey, min: number, max: number, step: number): HTMLElement => {
    const range = h('input', { class: 'cfg-range' });
    Object.assign(range, { type: 'range', min: String(min), max: String(max), step: String(step) });
    const num = h('input');
    Object.assign(num, { type: 'number', min: String(min), max: String(max), step: String(step) });
    const paint = (): void => {
      range.value = num.value = String(cfg[key]);
      range.style.setProperty('--p', `${((cfg[key] - min) / (max - min)) * 100}%`);
    };
    const set = (v: number): void => {
      if (!Number.isFinite(v)) return;
      cfg[key] = Math.min(max, Math.max(min, v));
      paint();
      applySoon();
    };
    range.addEventListener('input', () => set(Number(range.value)));
    num.addEventListener('input', () => set(Number(num.value)));
    paint();
    return h('div', { class: 'cfg-slider' }, h('div', { class: 'cfg-slider__head' }, h('span', { class: 'cfg-slider__label', text: label }), h('label', { class: 'cfg-slider__num' }, num)), range);
  };
  const chips = <K extends keyof Cfg>(key: K, items: [string, Cfg[K]][]): HTMLElement => {
    const box = h('div', { class: 'cfg-chips' });
    const buttons = items.map(([text, value]) => {
      const b = h('button', { class: `cfg-chip${cfg[key] === value ? ' is-on' : ''}`, text });
      b.addEventListener('click', () => {
        cfg[key] = value;
        buttons.forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        apply(true);
      });
      return b;
    });
    box.append(...buttons);
    return box;
  };
  type BoolKey = { [K in keyof Cfg]: Cfg[K] extends boolean ? K : never }[keyof Cfg];
  const toggle = (label: string, key: BoolKey): HTMLElement => {
    const input = h('input');
    input.type = 'checkbox';
    input.checked = cfg[key];
    input.addEventListener('change', () => {
      cfg[key] = input.checked;
      apply(true);
    });
    return h('label', { class: 'cfg-row' }, input, h('span', { text: label }));
  };
  const open = new Set(['Séries', 'Linhas e áreas']);
  const section = (title: string, ...children: HTMLElement[]): HTMLElement => {
    const d = h('details', { class: 'cfg-section cfg-details' }, h('summary', { text: title }), ...children);
    d.open = open.has(title);
    d.addEventListener('toggle', () => (d.open ? open.add(title) : open.delete(title)));
    return d;
  };

  const render = (): void => {
    panel.replaceChildren(
      h('div', { class: 'cfg-head' }, h('h2', { text: 'Configuração' }), h('button', { class: 'cfg-reset', text: 'Repor', onclick: () => ((cfg = { ...DEFAULT }), render(), apply(true)) })),
      section('Séries', slider('Número de séries', 'seriesCount', 1, 5, 1), toggle('Última série no eixo direito', 'dualAxis'), toggle('Valores nos pontos', 'labels')),
      section(
        'Linhas e áreas',
        chips('curve', [['Reta', 'linear'], ['Suave', 'smooth'], ['Degraus', 'step']]),
        slider('Espessura', 'width', 0.5, 6, 0.5),
        toggle('Área', 'area'),
        slider('Opacidade da área', 'areaOpacity', 0.05, 0.8, 0.05),
        chips('stacked', [['Sem empilhar', 'no'], ['Empilhar', 'yes'], ['100%', 'percent']]),
      ),
      section('Pontos', toggle('Mostrar pontos', 'points'), chips('shape', [['●', 'circle'], ['■', 'square'], ['◆', 'diamond'], ['▲', 'triangle']])),
      section('Eixos', toggle('Grelha', 'grid'), toggle('Eixo Y começa no zero', 'beginAtZero'), toggle('Zoom e pan', 'zoom')),
      section(
        'Legenda e tooltip',
        chips('legend', [['Cima', 'top'], ['Baixo', 'bottom'], ['Direita', 'right'], ['Esquerda', 'left'], ['Sem', 'off']]),
        chips('legendMarker', [['▬ Linha', 'line'], ['● Círculo', 'circle'], ['■ Quadrado', 'square']]),
        chips('tooltip', [['Partilhado', 'shared'], ['Ponto único', 'single'], ['Sem', 'off']]),
        toggle('Crosshair horizontal', 'crosshairH'),
      ),
      section('Aparência', chips('theme', [['Escuro', 'dark'], ['Claro', 'light']]), toggle('Mostrar dentro de um card', 'inCard'), toggle('Fundo transparente', 'transparent'), toggle('Animação', 'animation')),
    );
  };
  render();
  apply(false);
  return () => {
    cancelAnimationFrame(frame);
    chart.destroy();
  };
}
